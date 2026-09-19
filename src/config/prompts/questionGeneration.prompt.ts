export const QUESTION_GENERATION_PROMPT = `
Generate interview questions based on the job requirements and company research.

Return ONLY valid JSON.

Required format:
{
  "questions": [
    {
      "id": "Q-001",
      "question": "string",
      "category": "technical",
      "difficulty": "medium",
      "requirementIds": ["REQ-001"]
    }
  ]
}

Allowed categories:
- technical
- behavioral
- system-design
- company-fit

Allowed difficulty:
- easy
- medium
- hard

Rules:
- Every question must reference at least one requirement ID.
- Cover the important must-have requirements.
- Do not invent requirements or requirement IDs.
- Generate practical interview questions.
- Keep questions concise.
- Generate questions based on the provided company research where relevant.

Requirements and company research:
`;