export interface Question {
  id: string;
  question: string;
  category: "technical" | "behavioral" | "system-design" | "company-fit";
  difficulty: "easy" | "medium" | "hard";
  requirementIds: string[];
}