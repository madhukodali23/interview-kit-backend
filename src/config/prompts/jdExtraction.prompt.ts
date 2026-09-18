export const JD_EXTRACTION_PROMPT = `
Extract structured information from this job description.

Return ONLY valid JSON.

Required format:
{
  "roleTitle": "string",
  "requirements": [
    {
      "id": "REQ-001",
      "text": "string",
      "category": "string",
      "priority": "must"
    }
  ]
}

Rules:
- Identify the main role title.
- Extract important skills, responsibilities, qualifications, and experience requirements.
- Use "must" for explicit or essential requirements.
- Use "nice" for preferred but non-essential requirements.
- Give every requirement a unique ID.
- Do not invent requirements.

Job Description:
`;