import { Requirement } from "../types/interviewKit/requirement.js";
import { Question } from "../types/interviewKit/question.js";

export interface CoverageResult {
  requirementId: string;
  covered: boolean;
}

export const calculateCoverage = (
  requirements: Requirement[],
  questions: Question[],
): CoverageResult[] => {
  return requirements.map((requirement) => {
    const covered = questions.some((question) =>
      question.requirementIds.includes(requirement.id),
    );

    return {
      requirementId: requirement.id,
      covered,
    };
  });
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
  const coverage = calculateCoverage(
    requirements,
    questions,
  );

  const missingRequirements =
    getMissingMustRequirements(
      requirements,
      coverage,
    );

  if (missingRequirements.length === 0) {
    return questions;
  }

  const { generateMissingQuestions } =
    await import("./missingQuestions.service.js");

  const result = await generateMissingQuestions(
    missingRequirements,
  );

  return [
    ...questions,
    ...result.questions,
  ];
};