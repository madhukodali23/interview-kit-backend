import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { COMPANY_BRIEF_PROMPT } from "../config/prompts/companyBrief.prompt.js";
import { validateCompanyBrief } from "../layers/validation/schemas/companyBrief.schema.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";
import { CompanyBrief } from "../types/interviewKit/companyBrief.js";

export const NO_SOURCE_DATA_TEXT =
  "Not available from the provided sources.";

/**
 * The prompt allows the model to return an empty string for `overview`/
 * `industry` when company research didn't contain enough information. That
 * is structurally valid, but an empty string is a poor thing to show a
 * user. This deterministically backfills a safe, explicit fallback instead
 * of ever inventing company facts.
 */
export const applyCompanyBriefFallbacks = (
  brief: CompanyBrief,
): CompanyBrief => ({
  ...brief,
  overview: brief.overview?.trim() || NO_SOURCE_DATA_TEXT,
  industry: brief.industry?.trim() || NO_SOURCE_DATA_TEXT,
});

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

  return applyCompanyBriefFallbacks(result);
};
