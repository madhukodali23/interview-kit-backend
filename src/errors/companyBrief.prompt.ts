export const COMPANY_BRIEF_PROMPT = `
Create a concise company brief for interview preparation.

Use only the provided company research.

Return ONLY valid JSON.

Required format:
{
  "overview": "string",
  "products": ["string"],
  "industry": "string",
  "culture": ["string"],
  "engineering": ["string"]
}

Rules:
- Do not invent information.
- If information is unavailable, use an empty string or empty array.
- Focus on information useful for an interview candidate.

Company research:
`;