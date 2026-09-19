import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import {
  calculateCoverage,
  getMissingMustRequirements,
  completeCoverage,
} from "../services/coverage.service.js";
import { AppError } from "../errors/AppError.js";
import { Requirement } from "../types/interviewKit/requirement.js";
import { Question } from "../types/interviewKit/question.js";

const must = (id: string): Requirement => ({
  id,
  text: `Must requirement ${id}`,
  category: "technical",
  priority: "must",
});

const nice = (id: string): Requirement => ({
  id,
  text: `Nice requirement ${id}`,
  category: "technical",
  priority: "nice",
});

const question = (
  id: string,
  requirementIds: string[],
): Question => ({
  id,
  question: `Question ${id}`,
  category: "technical",
  difficulty: "medium",
  requirementIds,
});

describe("calculateCoverage", () => {
  it("marks a requirement covered when a question references it", () => {
    const coverage = calculateCoverage(
      [must("r1")],
      [question("q1", ["r1"])],
    );

    assert.deepEqual(coverage, [
      { requirementId: "r1", covered: true },
    ]);
  });

  it("marks a requirement uncovered when no question references it", () => {
    const coverage = calculateCoverage([must("r1")], []);

    assert.deepEqual(coverage, [
      { requirementId: "r1", covered: false },
    ]);
  });
});

describe("getMissingMustRequirements", () => {
  it("returns only uncovered MUST requirements", () => {
    const requirements = [must("r1"), must("r2"), nice("r3")];
    const coverage = calculateCoverage(requirements, [
      question("q1", ["r1"]),
    ]);

    const missing = getMissingMustRequirements(
      requirements,
      coverage,
    );

    assert.deepEqual(
      missing.map((requirement) => requirement.id),
      ["r2"],
    );
  });

  it("ignores uncovered NICE requirements", () => {
    const requirements = [nice("r1")];
    const coverage = calculateCoverage(requirements, []);

    assert.deepEqual(
      getMissingMustRequirements(requirements, coverage),
      [],
    );
  });
});

describe("completeCoverage", () => {
  it("returns the original questions untouched when every MUST requirement is already covered", async () => {
    const requirements = [must("r1")];
    const questions = [question("q1", ["r1"])];

    const result = await completeCoverage(
      requirements,
      questions,
    );

    assert.deepEqual(result, questions);
  });

  it("generates and merges missing questions for uncovered MUST requirements", async () => {
    const requirements = [must("r1"), must("r2")];
    const questions = [question("q1", ["r1"])];

    const generateMissing = mock.fn(
      async (missingRequirements: Requirement[]) => ({
        questions: [question("q-missing", ["r2"])],
      }),
    );

    const result = await completeCoverage(
      requirements,
      questions,
      generateMissing,
    );

    assert.equal(generateMissing.mock.callCount(), 1);

    const [calledWith] = generateMissing.mock.calls[0].arguments;

    assert.deepEqual(
      calledWith.map((requirement) => requirement.id),
      ["r2"],
    );

    assert.deepEqual(
      result.map((item) => item.id),
      ["q1", "q-missing"],
    );
  });

  it("throws COVERAGE_INCOMPLETE if MUST requirements are still uncovered after the second pass", async () => {
    const requirements = [must("r1")];
    const questions: Question[] = [];

    const generateMissing = mock.fn(async () => ({
      questions: [],
    }));

    await assert.rejects(
      () =>
        completeCoverage(
          requirements,
          questions,
          generateMissing,
        ),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(
          (error as AppError).code,
          "COVERAGE_INCOMPLETE",
        );
        return true;
      },
    );
  });
});
