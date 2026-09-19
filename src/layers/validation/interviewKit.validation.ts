import { validateCompanyUrl } from "../security/urlValidator.js";

export interface InterviewKitInput {
  jobDescription: string;
  companyUrl: string;
  days: number;
}

export const validateInterviewKitInput = (
  input: InterviewKitInput,
): string[] => {
  const errors: string[] = [];

  if (!input.jobDescription?.trim()) {
    errors.push("Job description is required");
  }

  if (!input.companyUrl?.trim()) {
    errors.push("Company URL is required");
  } else {
    try {
      validateCompanyUrl(input.companyUrl);
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : "Company URL is invalid",
      );
    }
  }

  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 60) {
    errors.push("Days must be an integer between 1 and 60");
  }

  return errors;
};