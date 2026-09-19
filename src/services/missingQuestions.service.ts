import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { MISSING_QUESTIONS_PROMPT } from "../config/prompts/missingQuestions.prompt.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { Question } from "../types/interviewKit/question.js";
import { filterUsableQuestions } from "../layers/validation/builder.validation.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export interface MissingQuestionsResult {
  questions: Question[];
}

export const generateMissingQuestions = async (
  requirements: Requirement[],
): Promise<MissingQuestionsResult> => {
  const response = await generateText({
    prompt: `${MISSING_QUESTIONS_PROMPT}

${JSON.stringify(requirements)}`,
  });

  const result = parseJsonResponse<MissingQuestionsResult>(
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
   * batch on one bad item. Deliberately not throwing on an empty result
   * here: `completeCoverage`'s second-pass check already re-verifies
   * coverage after this runs and reports a precise COVERAGE_INCOMPLETE
   * error if requirements are still unmet, which is more useful than a
   * generic invalid-response error at this stage.
   */
  const questions = filterUsableQuestions(
    result.questions,
    requirementIds,
  );

  return { questions };
};
