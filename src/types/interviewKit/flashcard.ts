export type PracticeConfidence = "low" | "medium" | "high";

export interface FlashcardPracticeState {
  confidence: PracticeConfidence;

  /**
   * User's own judgment that they know this card well enough.
   * Unrelated to the kit-level MUST requirement coverage.
   */
  covered: boolean;

  reviewCount: number;

  /**
   * ISO date string. Stored as a Mongo Date, serialized as a string over the API.
   */
  lastReviewedAt: string;
}

export interface Flashcard {
  id: string;
  questionId: string;
  front: string;
  back: string;
  requirementIds: string[];

  /**
   * true when the user explicitly created or edited this flashcard.
   * Regeneration must preserve it.
   */
  isUserEdited?: boolean;

  /**
   * true when the user wants this flashcard preserved.
   * Regeneration must preserve it.
   */
  isPinned?: boolean;

  /**
   * Present only once the user has practiced this card at least once.
   */
  practice?: FlashcardPracticeState;
}
