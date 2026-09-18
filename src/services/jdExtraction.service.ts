import { Requirement } from "../types/interviewKit/requirement.js";

export interface JobDescriptionExtraction {
  roleTitle: string;
  requirements: Requirement[];
}

export const extractJobDescription = (
  jobDescription: string,
): JobDescriptionExtraction => {
  // Temporary implementation.
  // LLM extraction will replace this later.
  return {
    roleTitle: "Unknown",
    requirements: [],
  };
};