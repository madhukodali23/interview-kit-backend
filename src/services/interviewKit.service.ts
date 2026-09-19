import {
  findInterviewKitById,
  findInterviewKitsByOwner,
  updateInterviewKitById,
  deleteInterviewKitById,
} from "../repositories/interviewKit.repository.js";

import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

import { InterviewKit } from "../types/interviewKit/interviewKit.js";
import { Question } from "../types/interviewKit/question.js";
import { Flashcard } from "../types/interviewKit/flashcard.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { CompanyBrief } from "../types/interviewKit/companyBrief.js";

import {
  validateEditableInterviewKit,
} from "../layers/validation/builder.validation.js";

import {
  generateQuestions,
} from "./questionGeneration.service.js";

import {
  generateFlashcards,
} from "./flashcardGeneration.service.js";

import {
  generateCompanyBrief,
} from "./companyBrief.service.js";

import {
  researchCompany,
  buildResearchWarnings,
} from "./companyResearch.service.js";

import {
  completeCoverage,
} from "./coverage.service.js";

export const notFoundError = () =>
  new AppError(
    ERROR_CODES.NOT_FOUND,
    ERROR_MESSAGES.NOT_FOUND,
    404,
  );

export const validationError = (
  errors: string[],
) =>
  new AppError(
    ERROR_CODES.KIT_VALIDATION_FAILED,
    `${ERROR_MESSAGES.KIT_VALIDATION_FAILED}: ${errors.join(", ")}`,
    400,
  );

export const getKitOrThrow = async (
  kitId: string,
  ownerId: string,
) => {
  const kit = await findInterviewKitById(
    kitId,
    ownerId,
  );

  if (!kit) {
    throw notFoundError();
  }

  return kit;
};

export const getMyInterviewKits = async (
  ownerId: string,
) => {
  return findInterviewKitsByOwner(ownerId);
};

export const getMyInterviewKitById = async (
  kitId: string,
  ownerId: string,
) => {
  return getKitOrThrow(kitId, ownerId);
};

/**
 * Updates the editable parts of a kit.
 *
 * The frontend sends the complete current arrays.
 * Therefore reordering is naturally preserved.
 */
export const updateMyInterviewKit = async (
  kitId: string,
  ownerId: string,
  updates: Partial<InterviewKit>,
) => {
  const existingKit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const allowedUpdates: Partial<InterviewKit> = {};

  if (updates.companyBrief !== undefined) {
    allowedUpdates.companyBrief =
      updates.companyBrief;
  }

  if (updates.role !== undefined) {
    allowedUpdates.role = updates.role;
  }

  if (updates.questions !== undefined) {
    allowedUpdates.questions =
      updates.questions;
  }

  if (updates.flashcards !== undefined) {
    allowedUpdates.flashcards =
      updates.flashcards;
  }

  if (updates.warnings !== undefined) {
    allowedUpdates.warnings =
      updates.warnings;
  }

  const candidateKit: InterviewKit = {
    source: existingKit.source,
    companyBrief:
      allowedUpdates.companyBrief ??
      existingKit.companyBrief,
    role:
      allowedUpdates.role ??
      existingKit.role,
    questions:
      allowedUpdates.questions ??
      existingKit.questions,
    flashcards:
      allowedUpdates.flashcards ??
      existingKit.flashcards,
    schedule: existingKit.schedule,
    coverage: existingKit.coverage,
    warnings:
      allowedUpdates.warnings ??
      existingKit.warnings,
  };

  const validationErrors =
    validateEditableInterviewKit(
      candidateKit,
    );

  if (validationErrors.length > 0) {
    throw validationError(
      validationErrors,
    );
  }

  const updatedKit =
    await updateInterviewKitById(
      kitId,
      ownerId,
      allowedUpdates,
    );

  if (!updatedKit) {
    throw notFoundError();
  }

  return updatedKit;
};

export const deleteMyInterviewKit = async (
  kitId: string,
  ownerId: string,
) => {
  const deleted =
    await deleteInterviewKitById(
      kitId,
      ownerId,
    );

  if (!deleted) {
    throw notFoundError();
  }
};

/* -------------------------------------------------------------------------- */
/*                           QUESTIONS OPERATIONS                             */
/* -------------------------------------------------------------------------- */

export const addQuestion = async (
  kitId: string,
  ownerId: string,
  question: Question,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const questions = [
    ...kit.questions,
    {
      ...question,
      isUserEdited: true,
    },
  ];

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      questions,
    },
  );
};

export const editQuestion = async (
  kitId: string,
  ownerId: string,
  questionId: string,
  updates: Partial<Question>,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const exists = kit.questions.some(
    (question) => question.id === questionId,
  );

  if (!exists) {
    throw notFoundError();
  }

  const questions = kit.questions.map(
    (question) =>
      question.id === questionId
        ? {
            ...question,
            ...updates,
            id: question.id,
            isUserEdited: true,
          }
        : question,
  );

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      questions,
    },
  );
};

export const deleteQuestion = async (
  kitId: string,
  ownerId: string,
  questionId: string,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const question = kit.questions.find(
    (item) => item.id === questionId,
  );

  if (!question) {
    throw notFoundError();
  }

  const questions =
    kit.questions.filter(
      (item) => item.id !== questionId,
    );

  const flashcards =
    kit.flashcards.filter(
      (flashcard) =>
        flashcard.questionId !== questionId,
    );

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      questions,
      flashcards,
    },
  );
};

export const reorderQuestions = async (
  kitId: string,
  ownerId: string,
  questionIds: string[],
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  if (
    questionIds.length !==
    kit.questions.length
  ) {
    throw validationError([
      "Question reorder must include every question",
    ]);
  }

  const questionMap = new Map(
    kit.questions.map((question) => [
      question.id,
      question,
    ]),
  );

  const reordered: Question[] = [];

  for (const id of questionIds) {
    const question = questionMap.get(id);

    if (!question) {
      throw validationError([
        `Unknown question ID: ${id}`,
      ]);
    }

    reordered.push(question);
  }

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      questions: reordered,
    },
  );
};

/* -------------------------------------------------------------------------- */
/*                           FLASHCARD OPERATIONS                             */
/* -------------------------------------------------------------------------- */

export const addFlashcard = async (
  kitId: string,
  ownerId: string,
  flashcard: Flashcard,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const flashcards = [
    ...kit.flashcards,
    {
      ...flashcard,
      isUserEdited: true,
    },
  ];

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      flashcards,
    },
  );
};

export const editFlashcard = async (
  kitId: string,
  ownerId: string,
  flashcardId: string,
  updates: Partial<Flashcard>,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const exists = kit.flashcards.some(
    (flashcard) =>
      flashcard.id === flashcardId,
  );

  if (!exists) {
    throw notFoundError();
  }

  const flashcards =
    kit.flashcards.map(
      (flashcard) =>
        flashcard.id === flashcardId
          ? {
              ...flashcard,
              ...updates,
              id: flashcard.id,
              isUserEdited: true,
            }
          : flashcard,
    );

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      flashcards,
    },
  );
};

export const deleteFlashcard = async (
  kitId: string,
  ownerId: string,
  flashcardId: string,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const exists = kit.flashcards.some(
    (flashcard) =>
      flashcard.id === flashcardId,
  );

  if (!exists) {
    throw notFoundError();
  }

  const flashcards =
    kit.flashcards.filter(
      (flashcard) =>
        flashcard.id !== flashcardId,
    );

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      flashcards,
    },
  );
};

export const reorderFlashcards = async (
  kitId: string,
  ownerId: string,
  flashcardIds: string[],
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  if (
    flashcardIds.length !==
    kit.flashcards.length
  ) {
    throw validationError([
      "Flashcard reorder must include every flashcard",
    ]);
  }

  const flashcardMap = new Map(
    kit.flashcards.map((flashcard) => [
      flashcard.id,
      flashcard,
    ]),
  );

  const reordered: Flashcard[] = [];

  for (const id of flashcardIds) {
    const flashcard =
      flashcardMap.get(id);

    if (!flashcard) {
      throw validationError([
        `Unknown flashcard ID: ${id}`,
      ]);
    }

    reordered.push(flashcard);
  }

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      flashcards: reordered,
    },
  );
};

/* -------------------------------------------------------------------------- */
/*                         REQUIREMENT OPERATIONS                             */
/* -------------------------------------------------------------------------- */

export const editRequirement = async (
  kitId: string,
  ownerId: string,
  requirementId: string,
  updates: Partial<Requirement>,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const exists =
    kit.role.requirements.some(
      (requirement) =>
        requirement.id === requirementId,
    );

  if (!exists) {
    throw notFoundError();
  }

  const requirements =
    kit.role.requirements.map(
      (requirement) =>
        requirement.id === requirementId
          ? {
              ...requirement,
              ...updates,
              id: requirement.id,
              isUserEdited: true,
            }
          : requirement,
    );

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      role: {
        ...kit.role,
        requirements,
      },
    },
  );
};

/* -------------------------------------------------------------------------- */
/*                         COMPANY BRIEF OPERATIONS                           */
/* -------------------------------------------------------------------------- */

export const editCompanyBrief = async (
  kitId: string,
  ownerId: string,
  updates: Partial<CompanyBrief>,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const companyBrief = {
    ...kit.companyBrief,
    ...updates,
    isUserEdited: true,
  };

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      companyBrief,
    },
  );
};

/* -------------------------------------------------------------------------- */
/*                         SECTION REGENERATION                              */
/* -------------------------------------------------------------------------- */

const buildCompanyResearchText = (
  research: Awaited<
    ReturnType<typeof researchCompany>
  >,
): string => {
  return [
    research.text,
    ...research.pages.map(
      (page) => page.text,
    ),
  ].join("\n\n");
};

export const regenerateQuestions = async (
  kitId: string,
  ownerId: string,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const research =
    await researchCompany(
      kit.source.companyUrl,
    );

  const researchText =
    buildCompanyResearchText(
      research,
    );

  const generated =
    await generateQuestions(
      kit.role.requirements,
      researchText,
    );

  const generatedQuestions =
    await completeCoverage(
      kit.role.requirements,
      generated.questions,
    );

  /**
   * User-created and pinned questions survive
   * regeneration.
   */
  const preserved =
    kit.questions.filter(
      (question) =>
        question.isUserEdited ||
        question.isPinned,
    );

  const preservedIds = new Set(
    preserved.map(
      (question) => question.id,
    ),
  );

  const regeneratedQuestions =
    generatedQuestions.filter(
      (question) =>
        !preservedIds.has(question.id),
    );

  const questions = [
    ...preserved,
    ...regeneratedQuestions,
  ];

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      questions,
      warnings: buildResearchWarnings(research),
    },
  );
};

export const regenerateFlashcards = async (
  kitId: string,
  ownerId: string,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const generated =
    await generateFlashcards(
      kit.questions,
    );

  const preserved =
    kit.flashcards.filter(
      (flashcard) =>
        flashcard.isUserEdited ||
        flashcard.isPinned,
    );

  const preservedIds = new Set(
    preserved.map(
      (flashcard) => flashcard.id,
    ),
  );

  const regeneratedFlashcards =
    generated.flashcards.filter(
      (flashcard) =>
        !preservedIds.has(
          flashcard.id,
        ),
    );

  const flashcards = [
    ...preserved,
    ...regeneratedFlashcards,
  ];

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      flashcards,
    },
  );
};

export const regenerateCompanyBrief = async (
  kitId: string,
  ownerId: string,
) => {
  const kit = await getKitOrThrow(
    kitId,
    ownerId,
  );

  const research =
    await researchCompany(
      kit.source.companyUrl,
    );

  const researchText =
    buildCompanyResearchText(
      research,
    );

  const companyBrief =
    await generateCompanyBrief(
      researchText,
    );

  return updateMyInterviewKit(
    kitId,
    ownerId,
    {
      companyBrief,
      warnings: buildResearchWarnings(research),
    },
  );
};