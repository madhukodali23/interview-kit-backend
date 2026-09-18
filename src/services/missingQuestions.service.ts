import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { MISSING_QUESTIONS_PROMPT } from "../config/prompts/missingQuestions.prompt.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { Question } from "../types/interviewKit/question.js";

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

  return parseJsonResponse<MissingQuestionsResult>(
    response.content,
  );
};