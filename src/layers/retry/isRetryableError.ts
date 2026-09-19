const RETRYABLE_ERROR_NAMES = [
  "APIConnectionError",
  "APIConnectionTimeoutError",
];

const RETRYABLE_ERROR_CODES = [
  "ECONNRESET",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
];

export const isRetryableError = (
  error: unknown,
): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const status =
    "status" in error
      ? (error as { status?: number }).status
      : undefined;

  if (status === 429) {
    return true;
  }

  if (status !== undefined && status >= 500) {
    return true;
  }

  if (status !== undefined) {
    // A defined non-retryable HTTP status (4xx other than 429).
    return false;
  }

  const name =
    "name" in error
      ? (error as { name?: string }).name
      : undefined;

  if (name && RETRYABLE_ERROR_NAMES.includes(name)) {
    return true;
  }

  const code =
    "code" in error
      ? (error as { code?: string }).code
      : undefined;

  if (code && RETRYABLE_ERROR_CODES.includes(code)) {
    return true;
  }

  return false;
};
