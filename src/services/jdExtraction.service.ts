import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { JD_EXTRACTION_PROMPT } from "../config/prompts/jdExtraction.prompt.js";
import { validateJDExtraction } from "../layers/validation/schemas/jdExtraction.schema.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export interface JobDescriptionExtraction {
  roleTitle: string;
  requirements: Requirement[];
}

export const extractJobDescription = async (
  jobDescription: string,
): Promise<JobDescriptionExtraction> => {
  const response = await generateText({
    prompt: `${JD_EXTRACTION_PROMPT}

${jobDescription}`,
  });

  const result =
  parseJsonResponse<JobDescriptionExtraction>(response.content);

const errors = validateJDExtraction(result);

if (errors.length > 0) {
  throw new AppError(
    ERROR_CODES.LLM_INVALID_RESPONSE,
    `${ERROR_MESSAGES.LLM_INVALID_RESPONSE}: ${errors.join(", ")}`,
    502,
  );
}

return result;
};
