import OpenAI from "openai";
import { env } from "../../config/env.js";
import { limits } from "../../config/limits.js";
import { withRetry } from "../../layers/retry/withRetry.js";

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

export const generateText = async (
  request: LLMRequest,
): Promise<LLMResponse> => {
  return withRetry(
    async () => {
      const response = await client.chat.completions.create({
        model: env.LLM_MODEL,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
      });

      return {
        content: response.choices[0]?.message?.content ?? "",
      };
    },
    limits.llm,
  );
};