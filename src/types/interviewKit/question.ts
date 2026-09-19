export interface Question {
  id: string;
  question: string;
  category:
    | "technical"
    | "behavioral"
    | "system-design"
    | "company-fit";
  difficulty: "easy" | "medium" | "hard";
  requirementIds: string[];

  /**
   * true when the user explicitly created or edited this question.
   * Regeneration must preserve it.
   */
  isUserEdited?: boolean;

  /**
   * true when the user wants this question preserved.
   * Regeneration must preserve it.
   */
  isPinned?: boolean;
}