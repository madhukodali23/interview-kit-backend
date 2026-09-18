import { InterviewKitInput } from "../layers/validation/interviewKit.validation.js";

export const createInterviewKit = (input: InterviewKitInput) => {
  return {
    message: "Interview kit creation started",
    input,
  };
};