export const FLASHCARD_GENERATION_PROMPT = `
Create interview preparation flashcards from the provided questions.

Return ONLY valid JSON.

Required format:
{
  "flashcards": [
    {
      "id": "FC-001",
      "questionId": "Q-001",
      "front": "string",
      "back": "string",
      "requirementIds": ["REQ-001"]
    }
  ]
}

Rules:
- Create one flashcard for each question.
- questionId must reference an existing question.
- requirementIds must come from the question.
- The front should contain the interview question.
- The back should contain a concise answer or preparation guidance.
- Do not invent requirement IDs.
- Do not invent question IDs.

Questions:
`;