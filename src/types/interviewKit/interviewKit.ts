import { Requirement } from "./requirement.js";
import { Question } from "./question.js";
import { Flashcard } from "./flashcard.js";
import { ScheduleDay } from "./schedule.js";
import { CompanyBrief } from "./companyBrief.js";

export interface InterviewKit {
  source: {
    jobDescription: string;
    companyUrl: string;
  };

  companyBrief: CompanyBrief;

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

  /**
   * Non-fatal issues encountered while building the kit, e.g. research
   * pages that were skipped because they were unreachable.
   */
  warnings?: string[];
}