import { AppError } from "../../errors/AppError.js";
import { ERROR_CODES } from "../../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../../errors/errorMessages.js";

const CODE_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i;

/**
 * LLMs frequently wrap JSON in markdown code fences, or prefix it with
 * commentary like "Here is the result:". This extracts the most likely
 * JSON substring before parsing.
 */
const extractJsonCandidate = (content: string): string => {
  const trimmed = content.trim();

  const fenceMatch = trimmed.match(CODE_FENCE_PATTERN);

  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");

  const starts = [firstBrace, firstBracket].filter(
    (index) => index !== -1,
  );

  if (starts.length === 0) {
    return trimmed;
  }

  const start = Math.min(...starts);
  const openChar = trimmed[start];
  const closeChar = openChar === "{" ? "}" : "]";
  const end = trimmed.lastIndexOf(closeChar);

  if (end === -1 || end <= start) {
    return trimmed;
  }

  return trimmed.slice(start, end + 1);
};

export const parseJsonResponse = <T>(content: string): T => {
  const candidate = extractJsonCandidate(content);

  try {
    return JSON.parse(candidate) as T;
  } catch {
    // Server-side only: never exposed in the AppError/client response, but
    // invaluable for diagnosing which stage/prompt an LLM went off the rails
    // on, since the client-facing message intentionally stays generic.
    console.error(
      "[parseJsonResponse] Failed to parse LLM response as JSON. Raw content preview:",
      content.slice(0, 1000),
      "\nCalled from:",
      new Error().stack?.split("\n").slice(2, 5).join("\n"),
    );

    throw new AppError(
      ERROR_CODES.LLM_INVALID_RESPONSE,
      ERROR_MESSAGES.LLM_INVALID_RESPONSE,
      502,
    );
  }
};
