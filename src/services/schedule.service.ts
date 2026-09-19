import { Question } from "../types/interviewKit/question.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { ScheduleDay } from "../types/interviewKit/schedule.js";

const DIFFICULTY_WEIGHT = {
  hard: 3,
  medium: 2,
  easy: 1,
} as const;

const MUST_HAVE_WEIGHT = 10;

const getQuestionPriority = (
  question: Question,
  requirements: Requirement[],
): number => {
  const hasMustRequirement = question.requirementIds.some(
    (requirementId) =>
      requirements.find((requirement) => requirement.id === requirementId)
        ?.priority === "must",
  );

  const difficultyWeight = DIFFICULTY_WEIGHT[question.difficulty];

  return (
    (hasMustRequirement ? MUST_HAVE_WEIGHT : 0) +
    difficultyWeight
  );
};

const getQuestionDuration = (
  question: Question,
): number => {
  switch (question.difficulty) {
    case "hard":
      return 30;

    case "medium":
      return 20;

    case "easy":
      return 15;

    default:
      return 15;
  }
};

export const generateSchedule = (
  questions: Question[],
  requirements: Requirement[],
  days: number,
): ScheduleDay[] => {
  if (!Number.isInteger(days) || days < 1 || days > 60) {
    throw new Error("Days must be an integer between 1 and 60");
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    const priorityDifference =
      getQuestionPriority(b, requirements) -
      getQuestionPriority(a, requirements);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.id.localeCompare(b.id);
  });

  const schedule: ScheduleDay[] = Array.from(
    { length: days },
    (_, index) => ({
      day: index + 1,
      focus: `Interview preparation - Day ${index + 1}`,
      questionIds: [],
      durationMinutes: 0,
    }),
  );

  if (sortedQuestions.length === 0) {
    return schedule;
  }

  const questionsPerDay = Math.ceil(
    sortedQuestions.length / days,
  );

  sortedQuestions.forEach((question, index) => {
    const dayIndex = Math.min(
      Math.floor(index / questionsPerDay),
      days - 1,
    );

    schedule[dayIndex].questionIds.push(question.id);

    schedule[dayIndex].durationMinutes +=
      getQuestionDuration(question);
  });

  return schedule;
};