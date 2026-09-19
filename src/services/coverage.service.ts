import { Requirement } from "../types/interviewKit/requirement.js";
import { Question } from "../types/interviewKit/question.js";
import { generateMissingQuestions } from "./missingQuestions.service.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export interface CoverageResult {
  requirementId: string;
  covered: boolean;
}

export const calculateCoverage = (
  requirements: Requirement[],
  questions: Question[],
): CoverageResult[] => {
  return requirements.map((requirement) => ({
    requirementId: requirement.id,
    covered: questions.some((question) =>
      question.requirementIds.includes(requirement.id),
    ),
  }));
};

export const getMissingMustRequirements = (
  requirements: Requirement[],
  coverage: CoverageResult[],
): Requirement[] => {
  return requirements.filter((requirement) => {
    if (requirement.priority !== "must") {
      return false;
    }

    const result = coverage.find(
      (item) => item.requirementId === requirement.id,
    );

    return !result?.covered;
  });
};

export const completeCoverage = async (
  requirements: Requirement[],
  questions: Question[],
): Promise<Question[]> => {
  const initialCoverage = calculateCoverage(
    requirements,
    questions,
  );

  const missingRequirements = getMissingMustRequirements(
    requirements,
    initialCoverage,
  );

  if (missingRequirements.length === 0) {
    return questions;
  }

  const result = await generateMissingQuestions(
    missingRequirements,
  );

  const updatedQuestions = [
    ...questions,
    ...result.questions,
  ];

  // Re-check after the second pass.
  const finalCoverage = calculateCoverage(
    requirements,
    updatedQuestions,
  );

  const stillMissing = getMissingMustRequirements(
    requirements,
    finalCoverage,
  );

  if (stillMissing.length > 0) {
    throw new AppError(
      ERROR_CODES.COVERAGE_INCOMPLETE,
      `${ERROR_MESSAGES.COVERAGE_INCOMPLETE}: ${stillMissing
        .map((requirement) => requirement.id)
        .join(", ")}`,
      502,
    );
  }

  return updatedQuestions;
};