import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { QUESTION_GENERATION_PROMPT } from "../config/prompts/questionGeneration.prompt.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { Question } from "../types/interviewKit/question.js";
import { filterUsableQuestions } from "../layers/validation/builder.validation.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export interface QuestionGenerationResult {
  questions: Question[];
}

export const generateQuestions = async (
  requirements: Requirement[],
  companyResearch: string,
): Promise<QuestionGenerationResult> => {
  const prompt = `${QUESTION_GENERATION_PROMPT}

${JSON.stringify({
  requirements,
  companyResearch,
})}`;

  const response = await generateText({
    prompt,
  });

  const result = parseJsonResponse<QuestionGenerationResult>(
    response.content,
  );

  if (!Array.isArray(result.questions)) {
    throw new AppError(
      ERROR_CODES.LLM_INVALID_RESPONSE,
      `${ERROR_MESSAGES.LLM_INVALID_RESPONSE}: questions must be an array`,
      502,
    );
  }

  const requirementIds = new Set(
    requirements.map((requirement) => requirement.id),
  );

  /**
   * Drop individually-malformed questions rather than failing the whole
   * batch on one bad item. `completeCoverage`'s second pass still verifies
   * every MUST requirement ends up covered, so this can't silently produce
   * an under-covered kit.
   */
  const questions = filterUsableQuestions(
    result.questions,
    requirementIds,
  );

  if (questions.length === 0) {
    throw new AppError(
      ERROR_CODES.LLM_INVALID_RESPONSE,
      `${ERROR_MESSAGES.LLM_INVALID_RESPONSE}: no usable questions were generated`,
      502,
    );
  }

  return { questions };
};
