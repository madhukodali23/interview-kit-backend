export const limits = {
  requestTimeoutMs: 10_000,
  maxPageSizeBytes: 2_000_000,
  requestBodySizeLimit: "1mb",
  maxRedirects: 3,
  allowedContentTypePrefixes: [
    "text/html",
    "application/xhtml+xml",
  ],

  llm: {
    retries: 3,
    baseDelayMs: 1_000,
    /**
     * Without an explicit cap, some OpenRouter-routed models (especially
     * free-tier ones) default to a low output limit and silently truncate
     * large JSON responses (e.g. a batch of flashcards) mid-object, which
     * then fails JSON parsing. This is generous enough for the largest
     * single-stage payload (a full flashcard/question batch).
     */
    maxOutputTokens: 8_192,
  },

  maxResearchPages: 5,

  /**
   * Below this combined character count, company research is considered too
   * thin to reliably ground a company brief. This doesn't stop the pipeline
   * — it's used to surface a warning so the fallback-heavy brief isn't a
   * silent surprise.
   */
  minUsefulResearchLength: 200,
};