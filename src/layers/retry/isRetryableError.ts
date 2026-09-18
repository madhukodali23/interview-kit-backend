export const isRetryableError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const status = "status" in error
    ? (error.status as number)
    : undefined;

  return status === 429 || (status !== undefined && status >= 500);
};