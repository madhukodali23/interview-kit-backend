import { createHash } from "node:crypto";

import { extractJobDescription } from "./jdExtraction.service.js";
import { runResearch } from "./research.service.js";
import { generateQuestions } from "./questionGeneration.service.js";
import { completeCoverage } from "./coverage.service.js";
import { generateFlashcards } from "./flashcardGeneration.service.js";
import { generateSchedule } from "./schedule.service.js";
import { validateSchedule } from "../layers/validation/schemas/schedule.schema.js";
import { validateInterviewKit } from "../layers/validation/schemas/interviewKit.schema.js";
import { validateEditableInterviewKit } from "../layers/validation/builder.validation.js";
import { saveInterviewKit } from "../repositories/interviewKit.repository.js";
import { InterviewKit } from "../types/interviewKit/interviewKit.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export interface CreateInterviewKitInput {
  jobDescription: string;
  companyUrl: string;
  days: number;
}

/**
 * Runs the full generation pipeline (retrieval -> extraction -> generation ->
 * scheduling -> final validation) and returns a kit ready to persist, without
 * touching the database. This is the piece the evaluation CLI reuses, so
 * batch evaluation runs the exact same pipeline as the live API.
 */
export const buildInterviewKit = async (
  input: CreateInterviewKitInput,
): Promise<InterviewKit> => {
  const jdExtraction = await extractJobDescription(
    input.jobDescription,
  );

  const research = await runResearch(
    input.companyUrl,
    jdExtraction.roleTitle,
  );

  const companyResearchText = [
    research.companyResearch.text,
    ...research.companyResearch.pages.map(
      (page) => page.text,
    ),
  ].join("\n\n");

  const questionResult = await generateQuestions(
    jdExtraction.requirements,
    companyResearchText,
  );

  const questions = await completeCoverage(
    jdExtraction.requirements,
    questionResult.questions,
  );

  const flashcardResult =
    await generateFlashcards(questions);

  const schedule = generateSchedule(
    questions,
    jdExtraction.requirements,
    input.days,
  );

  const scheduleErrors = validateSchedule(
    schedule,
    input.days,
  );

  if (scheduleErrors.length > 0) {
    throw new AppError(
      ERROR_CODES.KIT_VALIDATION_FAILED,
      `${ERROR_MESSAGES.KIT_VALIDATION_FAILED}: ${scheduleErrors.join(", ")}`,
      502,
    );
  }

  const coverage = jdExtraction.requirements.map(
    (requirement) => ({
      requirementId: requirement.id,
      covered: questions.some((question) =>
        question.requirementIds.includes(requirement.id),
      ),
    }),
  );

  const kit: InterviewKit = {
    source: {
      jobDescription: input.jobDescription,
      companyUrl: input.companyUrl,
    },
    companyBrief: research.companyBrief,
    role: {
      title: jdExtraction.roleTitle,
      requirements: jdExtraction.requirements,
    },
    questions,
    flashcards: flashcardResult.flashcards,
    schedule,
    coverage,
    warnings: research.warnings,
  };

  /**
   * Final validation gate before the kit is returned/persisted. Combines the
   * schema-level shape check with the deeper builder-level check
   * (question/flashcard content, requirement references, company brief
   * shape) so a malformed pipeline output never reaches the database.
   */
  const validationErrors = [
    ...validateInterviewKit(kit),
    ...validateEditableInterviewKit(kit),
  ];

  if (validationErrors.length > 0) {
    throw new AppError(
      ERROR_CODES.KIT_VALIDATION_FAILED,
      `${ERROR_MESSAGES.KIT_VALIDATION_FAILED}: ${validationErrors.join(", ")}`,
      502,
    );
  }

  return kit;
};

const inFlightRequests = new Set<string>();

/**
 * In-memory guard against duplicate concurrent submissions of the exact same
 * request (e.g. an accidental double-click while generation is running).
 * Per-process only: a multi-instance deployment would need a shared store
 * (e.g. Redis) instead.
 */
const buildRequestKey = (
  input: CreateInterviewKitInput,
  ownerId: string,
): string => {
  return createHash("sha256")
    .update(
      `${ownerId}:${input.jobDescription}:${input.companyUrl}:${input.days}`,
    )
    .digest("hex");
};

export const createInterviewKit = async (
  input: CreateInterviewKitInput,
  ownerId: string,
) => {
  const requestKey = buildRequestKey(input, ownerId);

  if (inFlightRequests.has(requestKey)) {
    throw new AppError(
      ERROR_CODES.DUPLICATE_REQUEST,
      ERROR_MESSAGES.DUPLICATE_REQUEST,
      409,
    );
  }

  inFlightRequests.add(requestKey);

  try {
    const kit = await buildInterviewKit(input);

    const savedKit = await saveInterviewKit(kit, ownerId);

    return {
      id: savedKit._id.toString(),
      ...kit,
    };
  } finally {
    inFlightRequests.delete(requestKey);
  }
};
