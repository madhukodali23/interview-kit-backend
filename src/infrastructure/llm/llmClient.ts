import OpenAI from "openai";
import { env } from "../../config/env.js";
import { limits } from "../../config/limits.js";
import { withRetry } from "../../layers/retry/withRetry.js";
import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../../errors/errorMessages.js";

const client = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export interface LLMRequest {
  prompt: string;
}

export interface LLMResponse {
  content: string;
}

const getErrorStatus = (
  error: unknown,
): number | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  return "status" in error
    ? (error as { status?: number }).status
    : undefined;
};

/**
 * Maps any error that escapes the retry loop into a domain AppError so the
 * error middleware never has to special-case the OpenAI SDK's error shapes.
 */
const mapLLMError = (error: unknown): AppError => {
  if (getErrorStatus(error) === 429) {
    return new AppError(
      ERROR_CODES.LLM_RATE_LIMITED,
      ERROR_MESSAGES.LLM_RATE_LIMITED,
      429,
    );
  }

  return new AppError(
    ERROR_CODES.LLM_UNAVAILABLE,
    ERROR_MESSAGES.LLM_UNAVAILABLE,
    502,
  );
};

export const generateText = async (
  request: LLMRequest,
): Promise<LLMResponse> => {
  try {
    return await withRetry(async () => {
      const response = await client.chat.completions.create({
        model: env.LLM_MODEL,
        max_tokens: limits.llm.maxOutputTokens,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
      });

      const choice = response.choices[0];
      const content = choice?.message?.content;

      if (!content) {
        throw new AppError(
          ERROR_CODES.LLM_INVALID_RESPONSE,
          ERROR_MESSAGES.LLM_INVALID_RESPONSE,
          502,
        );
      }

      if (choice.finish_reason === "length") {
        // Server-side diagnostic only: the response was cut off before
        // completion. Parsing will very likely fail downstream; this makes
        // the real cause obvious instead of a bare "invalid JSON" log.
        console.error(
          "[generateText] Response was truncated (finish_reason=length). Consider raising limits.llm.maxOutputTokens or reducing batch size.",
        );
      }

      return { content };
    }, limits.llm);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw mapLLMError(error);
  }
};
