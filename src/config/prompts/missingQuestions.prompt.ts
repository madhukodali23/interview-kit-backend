export const MISSING_QUESTIONS_PROMPT = `
Generate interview questions for the uncovered job requirements below.

Return ONLY valid JSON.

Required format:
{
  "questions": [
    {
      "id": "Q-MISSING-001",
      "question": "string",
      "category": "technical",
      "difficulty": "medium",
      "requirementIds": ["REQ-001"]
    }
  ]
}

Rules:
- Every question MUST reference one of the provided requirement IDs.
- Generate at least one question for every requirement.
- Do not invent requirement IDs.
- Use only these categories:
  technical, behavioral, system-design, company-fit
- Use only these difficulties:
  easy, medium, hard

Uncovered requirements:
`;