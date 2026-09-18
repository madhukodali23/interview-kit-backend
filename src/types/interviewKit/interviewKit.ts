import { Requirement } from "./requirement.js";
import { Question } from "./question.js";
import { Flashcard } from "./flashcard.js";
import { ScheduleDay } from "./schedule.js";

export interface InterviewKit {
  source: {
    jobDescription: string;
    companyUrl: string;
  };

  companyBrief: string;

  role: {
    title: string;
    requirements: Requirement[];
  };

  questions: Question[];

  flashcards: Flashcard[];

  schedule: ScheduleDay[];

  coverage: {
    requirementId: string;
    covered: boolean;
  }[];
}