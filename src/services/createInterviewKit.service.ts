import { extractJobDescription } from "./jdExtraction.service.js";
import { runResearch } from "./research.service.js";

export interface CreateInterviewKitInput {
  jobDescription: string;
  companyUrl: string;
  days: number;
}

export const createInterviewKit = async (
  input: CreateInterviewKitInput,
) => {
  // 1. Extract role and requirements from JD
  const jdExtraction = await extractJobDescription(
    input.jobDescription,
  );

  // 2. Research company
const research = await runResearch(
  input.companyUrl,
  jdExtraction.roleTitle,
);

  return {
    input,
    jdExtraction,
    research,
  };
};