import { InterviewKit } from "../../types/interviewKit/interviewKit.js";
import { Question } from "../../types/interviewKit/question.js";
import { Flashcard } from "../../types/interviewKit/flashcard.js";

const QUESTION_CATEGORIES = [
  "technical",
  "behavioral",
  "system-design",
  "company-fit",
] as const;

const DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
] as const;

const isNonEmptyString = (
  value: unknown,
): value is string => {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
};

export const validateQuestions = (
  questions: Question[],
  requirementIds: Set<string>,
): string[] => {
  const errors: string[] = [];
  const questionIds = new Set<string>();

  questions.forEach((question, index) => {
    const position = `Question ${index + 1}`;

    if (!isNonEmptyString(question.id)) {
      errors.push(`${position} ID is required`);
    }

    if (questionIds.has(question.id)) {
      errors.push(`${position} has duplicate ID`);
    }

    questionIds.add(question.id);

    if (!isNonEmptyString(question.question)) {
      errors.push(`${position} text is required`);
    }

    if (
      !QUESTION_CATEGORIES.includes(
        question.category,
      )
    ) {
      errors.push(
        `${position} has an invalid category`,
      );
    }

    if (
      !DIFFICULTIES.includes(question.difficulty)
    ) {
      errors.push(
        `${position} has an invalid difficulty`,
      );
    }

    if (!Array.isArray(question.requirementIds)) {
      errors.push(
        `${position} requirementIds must be an array`,
      );
      return;
    }

    if (question.requirementIds.length === 0) {
      errors.push(
        `${position} must reference at least one requirement`,
      );
    }

    question.requirementIds.forEach(
      (requirementId) => {
        if (!requirementIds.has(requirementId)) {
          errors.push(
            `${position} references unknown requirement ${requirementId}`,
          );
        }
      },
    );
  });

  return errors;
};

export const validateFlashcards = (
  flashcards: Flashcard[],
  questions: Question[],
): string[] => {
  const errors: string[] = [];

  const questionIds = new Set(
    questions.map((question) => question.id),
  );

  const flashcardIds = new Set<string>();

  flashcards.forEach((flashcard, index) => {
    const position = `Flashcard ${index + 1}`;

    if (!isNonEmptyString(flashcard.id)) {
      errors.push(`${position} ID is required`);
    }

    if (flashcardIds.has(flashcard.id)) {
      errors.push(`${position} has duplicate ID`);
    }

    flashcardIds.add(flashcard.id);

    if (!isNonEmptyString(flashcard.questionId)) {
      errors.push(
        `${position} questionId is required`,
      );
    } else if (
      !questionIds.has(flashcard.questionId)
    ) {
      errors.push(
        `${position} references unknown question ${flashcard.questionId}`,
      );
    }

    if (!isNonEmptyString(flashcard.front)) {
      errors.push(`${position} front is required`);
    }

    if (!isNonEmptyString(flashcard.back)) {
      errors.push(`${position} back is required`);
    }

    if (!Array.isArray(flashcard.requirementIds)) {
      errors.push(
        `${position} requirementIds must be an array`,
      );
    }
  });

  return errors;
};

export const validateEditableInterviewKit = (
  kit: InterviewKit,
): string[] => {
  const errors: string[] = [];

  if (!kit.role?.title?.trim()) {
    errors.push("Role title is required");
  }

  if (!Array.isArray(kit.role?.requirements)) {
    errors.push("Requirements must be an array");
    return errors;
  }

  const requirementIds = new Set<string>();

  kit.role.requirements.forEach(
    (requirement, index) => {
      if (!isNonEmptyString(requirement.id)) {
        errors.push(
          `Requirement ${index + 1} ID is required`,
        );
      }

      if (requirementIds.has(requirement.id)) {
        errors.push(
          `Requirement ${index + 1} has duplicate ID`,
        );
      }

      requirementIds.add(requirement.id);

      if (!isNonEmptyString(requirement.text)) {
        errors.push(
          `Requirement ${index + 1} text is required`,
        );
      }

      if (
        requirement.priority !== "must" &&
        requirement.priority !== "nice"
      ) {
        errors.push(
          `Requirement ${index + 1} has invalid priority`,
        );
      }
    },
  );

  if (
    !kit.companyBrief ||
    !isNonEmptyString(kit.companyBrief.overview) ||
    !isNonEmptyString(kit.companyBrief.industry) ||
    !Array.isArray(kit.companyBrief.products) ||
    !Array.isArray(kit.companyBrief.culture) ||
    !Array.isArray(kit.companyBrief.engineering)
  ) {
    errors.push("Company brief is invalid");
  }

  if (!Array.isArray(kit.questions)) {
    errors.push("Questions must be an array");
  } else {
    errors.push(
      ...validateQuestions(
        kit.questions,
        requirementIds,
      ),
    );
  }

  if (!Array.isArray(kit.flashcards)) {
    errors.push("Flashcards must be an array");
  } else {
    errors.push(
      ...validateFlashcards(
        kit.flashcards,
        Array.isArray(kit.questions)
          ? kit.questions
          : [],
      ),
    );
  }

  return errors;
};