import { generateText } from "../infrastructure/llm/llmClient.js";
import { parseJsonResponse } from "../layers/parsing/jsonParser.js";
import { FLASHCARD_GENERATION_PROMPT } from "../config/prompts/flashcardGeneration.prompt.js";
import { Question } from "../types/interviewKit/question.js";
import { Flashcard } from "../types/interviewKit/flashcard.js";
import { filterUsableFlashcards } from "../layers/validation/builder.validation.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export interface FlashcardGenerationResult {
  flashcards: Flashcard[];
}

export const generateFlashcards = async (
  questions: Question[],
): Promise<FlashcardGenerationResult> => {
  if (questions.length === 0) {
    return {
      flashcards: [],
    };
  }

  const response = await generateText({
    prompt: `${FLASHCARD_GENERATION_PROMPT}

${JSON.stringify(questions)}`,
  });

  const result = parseJsonResponse<FlashcardGenerationResult>(
    response.content,
  );

  if (!Array.isArray(result.flashcards)) {
    throw new AppError(
      ERROR_CODES.LLM_INVALID_RESPONSE,
      `${ERROR_MESSAGES.LLM_INVALID_RESPONSE}: flashcards must be an array`,
      502,
    );
  }

  const questionIds = new Set(
    questions.map((question) => question.id),
  );

  /**
   * Drop individually-malformed flashcards rather than failing the whole
   * batch on one bad item.
   */
  const flashcards = filterUsableFlashcards(
    result.flashcards,
    questionIds,
  );

  if (flashcards.length === 0) {
    throw new AppError(
      ERROR_CODES.LLM_INVALID_RESPONSE,
      `${ERROR_MESSAGES.LLM_INVALID_RESPONSE}: no usable flashcards were generated`,
      502,
    );
  }

  return { flashcards };
};
