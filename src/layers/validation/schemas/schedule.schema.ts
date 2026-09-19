import { ScheduleDay } from "../../../types/interviewKit/schedule.js";

export const validateSchedule = (
  schedule: ScheduleDay[],
  expectedDays: number,
): string[] => {
  const errors: string[] = [];

  if (!Array.isArray(schedule)) {
    return ["Schedule must be an array"];
  }

  if (schedule.length !== expectedDays) {
    errors.push(
      `Schedule must contain exactly ${expectedDays} days`,
    );
  }

  schedule.forEach((day, index) => {
    if (day.day !== index + 1) {
      errors.push(
        `Expected day ${index + 1} but received day ${day.day}`,
      );
    }

    if (!day.focus?.trim()) {
      errors.push(`Day ${day.day} focus is required`);
    }

    if (!Array.isArray(day.questionIds)) {
      errors.push(
        `Day ${day.day} questionIds must be an array`,
      );
    }

    if (!Number.isInteger(day.durationMinutes)) {
      errors.push(
        `Day ${day.day} duration must be an integer`,
      );
    }

    if (day.durationMinutes < 0) {
      errors.push(
        `Day ${day.day} duration cannot be negative`,
      );
    }
  });

  return errors;
};