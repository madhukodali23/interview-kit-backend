import {
  getKitOrThrow,
  notFoundError,
  validationError,
  updateMyInterviewKit,
  toPlainObject,
} from "./interviewKit.service.js";

import {
  validatePracticeReviewInput,
  PracticeReviewInput,
} from "../layers/validation/practice.validation.js";

import {
  Flashcard,
  PracticeConfidence,
} from "../types/interviewKit/flashcard.js";

export interface PracticeSummary {
  total: number;
  reviewed: number;
  covered: number;
  uncovered: number;
  confidenceBreakdown: Record<PracticeConfidence, number>;
}

export interface PracticeSessionResult {
  cards: Flashcard[];
  summary: PracticeSummary;
}

export interface PracticeReviewResult {
  flashcard: Flashcard;
  next: Flashcard | null;
  summary: PracticeSummary;
}

/**
 * Never-practiced and low-confidence cards sort first.
 * Cards the user marked "covered" sort last, regardless of confidence.
 */
const getPracticePriority = (
  flashcard: Flashcard,
): number => {
  if (!flashcard.practice) {
    return 0;
  }

  if (flashcard.practice.covered) {
    return 4;
  }

  const confidenceOrder: Record<
    PracticeConfidence,
    number
  > = {
    low: 1,
    medium: 2,
    high: 3,
  };

  return confidenceOrder[flashcard.practice.confidence];
};

const orderForPractice = (
  flashcards: Flashcard[],
): Flashcard[] => {
  return [...flashcards].sort(
    (a, b) =>
      getPracticePriority(a) - getPracticePriority(b),
  );
};

const buildPracticeSummary = (
  flashcards: Flashcard[],
): PracticeSummary => {
  const confidenceBreakdown: Record<
    PracticeConfidence,
    number
  > = {
    low: 0,
    medium: 0,
    high: 0,
  };

  let reviewed = 0;
  let covered = 0;

  flashcards.forEach((flashcard) => {
    if (!flashcard.practice) {
      return;
    }

    reviewed += 1;
    confidenceBreakdown[flashcard.practice.confidence] += 1;

    if (flashcard.practice.covered) {
      covered += 1;
    }
  });

  return {
    total: flashcards.length,
    reviewed,
    covered,
    uncovered: flashcards.length - covered,
    confidenceBreakdown,
  };
};

export const getPracticeSession = async (
  kitId: string,
  ownerId: string,
): Promise<PracticeSessionResult> => {
  const kit = await getKitOrThrow(kitId, ownerId);

  return {
    cards: orderForPractice(kit.flashcards),
    summary: buildPracticeSummary(kit.flashcards),
  };
};

export const submitPracticeReview = async (
  kitId: string,
  ownerId: string,
  flashcardId: string,
  input: Partial<PracticeReviewInput>,
): Promise<PracticeReviewResult> => {
  const errors = validatePracticeReviewInput(input);

  if (errors.length > 0) {
    throw validationError(errors);
  }

  const { confidence, covered } =
    input as PracticeReviewInput;

  const kit = await getKitOrThrow(kitId, ownerId);

  const target = kit.flashcards.find(
    (flashcard) => flashcard.id === flashcardId,
  );

  if (!target) {
    throw notFoundError();
  }

  const previousReviewCount =
    target.practice?.reviewCount ?? 0;

  const lastReviewedAt = new Date().toISOString();

  const flashcards = kit.flashcards.map(
    (flashcard) =>
      flashcard.id === flashcardId
        ? {
            ...toPlainObject(flashcard),
            practice: {
              confidence,
              covered,
              reviewCount: previousReviewCount + 1,
              lastReviewedAt,
            },
          }
        : flashcard,
  );

  const updatedKit = await updateMyInterviewKit(
    kitId,
    ownerId,
    { flashcards },
  );

  const updatedFlashcard = updatedKit.flashcards.find(
    (flashcard) => flashcard.id === flashcardId,
  );

  if (!updatedFlashcard) {
    throw notFoundError();
  }

  const next =
    orderForPractice(updatedKit.flashcards).filter(
      (flashcard) => flashcard.id !== flashcardId,
    )[0] ?? null;

  return {
    flashcard: updatedFlashcard,
    next,
    summary: buildPracticeSummary(updatedKit.flashcards),
  };
};
