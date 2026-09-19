export const ERROR_MESSAGES = {
  INVALID_REQUEST: "Invalid request",
  UNAUTHORIZED: "Unauthorized",
  NOT_FOUND: "Resource not found",
  COMPANY_UNREACHABLE: "Company website could not be reached",
  LLM_RATE_LIMITED: "AI service rate limit reached",
  LLM_INVALID_RESPONSE: "AI service returned an invalid response",
  LLM_UNAVAILABLE: "AI service is temporarily unavailable",
  KIT_VALIDATION_FAILED: "Interview kit validation failed",
  COVERAGE_INCOMPLETE: "Could not generate coverage for all required topics",
  DUPLICATE_REQUEST: "An identical request is already being processed",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists",
} as const;