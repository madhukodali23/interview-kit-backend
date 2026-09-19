import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { generateSchedule } from "../services/schedule.service.js";
import { validateSchedule } from "../layers/validation/schemas/schedule.schema.js";
import { Question } from "../types/interviewKit/question.js";
import { Requirement } from "../types/interviewKit/requirement.js";

const buildRequirement = (
  overrides: Partial<Requirement> = {},
): Requirement => ({
  id: "req-1",
  text: "Must know TypeScript",
  category: "technical",
  priority: "must",
  ...overrides,
});

const buildQuestion = (
  overrides: Partial<Question> = {},
): Question => ({
  id: "q-1",
  question: "Explain closures",
  category: "technical",
  difficulty: "medium",
  requirementIds: ["req-1"],
  ...overrides,
});

describe("generateSchedule", () => {
  it("produces exactly the requested number of days", () => {
    const requirements = [buildRequirement()];
    const questions = Array.from(
      { length: 10 },
      (_, index) => buildQuestion({ id: `q-${index + 1}` }),
    );

    for (const days of [1, 3, 7, 14]) {
      const schedule = generateSchedule(
        questions,
        requirements,
        days,
      );

      assert.equal(schedule.length, days);
    }
  });

  it("numbers days sequentially starting at 1", () => {
    const schedule = generateSchedule(
      [buildQuestion()],
      [buildRequirement()],
      3,
    );

    assert.deepEqual(
      schedule.map((day) => day.day),
      [1, 2, 3],
    );
  });

  it("schedules every question exactly once", () => {
    const requirements = [buildRequirement()];
    const questions = Array.from(
      { length: 7 },
      (_, index) => buildQuestion({ id: `q-${index + 1}` }),
    );

    const schedule = generateSchedule(
      questions,
      requirements,
      3,
    );

    const scheduledIds = schedule.flatMap(
      (day) => day.questionIds,
    );

    assert.equal(scheduledIds.length, questions.length);
    assert.deepEqual(
      [...scheduledIds].sort(),
      questions.map((question) => question.id).sort(),
    );
  });

  it("produces an empty-but-complete schedule when there are no questions", () => {
    const schedule = generateSchedule(
      [],
      [buildRequirement()],
      5,
    );

    assert.equal(schedule.length, 5);

    schedule.forEach((day) => {
      assert.deepEqual(day.questionIds, []);
      assert.equal(day.durationMinutes, 0);
    });
  });

  it("is deterministic for the same input", () => {
    const requirements = [buildRequirement()];
    const questions = Array.from(
      { length: 9 },
      (_, index) =>
        buildQuestion({
          id: `q-${index + 1}`,
          difficulty: index % 2 === 0 ? "hard" : "easy",
        }),
    );

    const first = generateSchedule(questions, requirements, 4);
    const second = generateSchedule(questions, requirements, 4);

    assert.deepEqual(first, second);
  });

  it("rejects an invalid number of days", () => {
    const requirements = [buildRequirement()];
    const questions = [buildQuestion()];

    assert.throws(() =>
      generateSchedule(questions, requirements, 0),
    );
    assert.throws(() =>
      generateSchedule(questions, requirements, 61),
    );
    assert.throws(() =>
      generateSchedule(questions, requirements, 1.5),
    );
  });

  it("produces a schedule that passes validateSchedule", () => {
    const requirements = [buildRequirement()];
    const questions = Array.from(
      { length: 5 },
      (_, index) => buildQuestion({ id: `q-${index + 1}` }),
    );

    const schedule = generateSchedule(
      questions,
      requirements,
      3,
    );

    assert.deepEqual(validateSchedule(schedule, 3), []);
  });

  it("keeps every requirement's question reachable in the schedule", () => {
    const mustRequirement = buildRequirement({
      id: "must-1",
      priority: "must",
    });

    const niceRequirement = buildRequirement({
      id: "nice-1",
      priority: "nice",
    });

    const questions = [
      buildQuestion({
        id: "q-must",
        requirementIds: ["must-1"],
      }),
      buildQuestion({
        id: "q-nice",
        requirementIds: ["nice-1"],
      }),
    ];

    const schedule = generateSchedule(
      questions,
      [mustRequirement, niceRequirement],
      2,
    );

    const scheduledIds = new Set(
      schedule.flatMap((day) => day.questionIds),
    );

    assert.ok(scheduledIds.has("q-must"));
    assert.ok(scheduledIds.has("q-nice"));
  });
});

describe("validateSchedule", () => {
  it("flags a schedule with the wrong number of days", () => {
    const errors = validateSchedule(
      [
        {
          day: 1,
          focus: "Day 1",
          questionIds: [],
          durationMinutes: 0,
        },
      ],
      2,
    );

    assert.ok(
      errors.some((error) =>
        error.includes("exactly 2 days"),
      ),
    );
  });

  it("flags out-of-order day numbers", () => {
    const errors = validateSchedule(
      [
        {
          day: 1,
          focus: "Day 1",
          questionIds: [],
          durationMinutes: 0,
        },
        {
          day: 3,
          focus: "Day 2",
          questionIds: [],
          durationMinutes: 0,
        },
      ],
      2,
    );

    assert.ok(errors.length > 0);
  });

  it("flags negative duration", () => {
    const errors = validateSchedule(
      [
        {
          day: 1,
          focus: "Day 1",
          questionIds: [],
          durationMinutes: -5,
        },
      ],
      1,
    );

    assert.ok(
      errors.some((error) =>
        error.includes("cannot be negative"),
      ),
    );
  });
});
