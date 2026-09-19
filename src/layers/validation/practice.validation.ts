import { PracticeConfidence } from "../../types/interviewKit/flashcard.js";

const CONFIDENCE_LEVELS: PracticeConfidence[] = [
  "low",
  "medium",
  "high",
];

export interface PracticeReviewInput {
  confidence: PracticeConfidence;
  covered: boolean;
}

export const validatePracticeReviewInput = (
  input: Partial<PracticeReviewInput>,
): string[] => {
  const errors: string[] = [];

  if (
    typeof input.confidence !== "string" ||
    !CONFIDENCE_LEVELS.includes(
      input.confidence as PracticeConfidence,
    )
  ) {
    errors.push(
      "Confidence must be one of: low, medium, high",
    );
  }

  if (typeof input.covered !== "boolean") {
    errors.push("Covered must be a boolean");
  }

  return errors;
};
