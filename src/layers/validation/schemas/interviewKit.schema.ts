import { InterviewKit } from "../../../types/interviewKit/interviewKit.js";

export const validateInterviewKit = (
  kit: InterviewKit,
): string[] => {
  const errors: string[] = [];

  if (!kit.source?.jobDescription) {
    errors.push("Source job description is required");
  }

  if (!kit.source?.companyUrl) {
    errors.push("Source company URL is required");
  }

  if (!kit.role?.title) {
    errors.push("Role title is required");
  }

  if (!Array.isArray(kit.role?.requirements)) {
    errors.push("Requirements must be an array");
  }

  if (!Array.isArray(kit.questions)) {
    errors.push("Questions must be an array");
  }

  if (!Array.isArray(kit.flashcards)) {
    errors.push("Flashcards must be an array");
  }

  if (!Array.isArray(kit.schedule)) {
    errors.push("Schedule must be an array");
  }

  if (!Array.isArray(kit.coverage)) {
    errors.push("Coverage must be an array");
  }

  return errors;
};