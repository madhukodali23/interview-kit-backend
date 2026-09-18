export const limits = {
  requestTimeoutMs: 10_000,
  maxPageSizeBytes: 2_000_000,

  llm: {
    retries: 3,
    baseDelayMs: 1_000,
  },

  maxResearchPages: 5,
};