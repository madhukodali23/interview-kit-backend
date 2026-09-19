export const limits = {
  requestTimeoutMs: 10_000,
  maxPageSizeBytes: 2_000_000,
  maxRedirects: 3,
  allowedContentTypePrefixes: [
    "text/html",
    "application/xhtml+xml",
  ],

  llm: {
    retries: 3,
    baseDelayMs: 1_000,
  },

  maxResearchPages: 5,
};