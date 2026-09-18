export interface Flashcard {
  id: string;
  questionId: string;
  front: string;
  back: string;
  requirementIds: string[];
}