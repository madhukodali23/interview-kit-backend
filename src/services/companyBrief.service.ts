import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { COMPANY_BRIEF_PROMPT } from "../config/prompts/companyBrief.prompt.js";
import { validateCompanyBrief } from "../layers/validation/schemas/companyBrief.schema.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";
import { CompanyBrief } from "../types/interviewKit/companyBrief.js";

export const generateCompanyBrief = async (
  companyResearch: string,
): Promise<CompanyBrief> => {
  const response = await generateText({
    prompt: `${COMPANY_BRIEF_PROMPT}

${companyResearch}`,
  });

  const result = parseJsonResponse<CompanyBrief>(
    response.content,
  );

  const errors = validateCompanyBrief(result);

  if (errors.length > 0) {
    throw new AppError(
      ERROR_CODES.LLM_INVALID_RESPONSE,
      `${ERROR_MESSAGES.LLM_INVALID_RESPONSE}: ${errors.join(", ")}`,
      502,
    );
  }

  return result;
};