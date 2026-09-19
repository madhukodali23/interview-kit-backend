import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validateEditableInterviewKit } from "../layers/validation/builder.validation.js";
import { validateInterviewKit } from "../layers/validation/schemas/interviewKit.schema.js";
import { validateCompanyBrief } from "../layers/validation/schemas/companyBrief.schema.js";
import { validateJDExtraction } from "../layers/validation/schemas/jdExtraction.schema.js";
import { validatePracticeReviewInput } from "../layers/validation/practice.validation.js";
import {
  applyCompanyBriefFallbacks,
  NO_SOURCE_DATA_TEXT,
} from "../services/companyBrief.service.js";
import { InterviewKit } from "../types/interviewKit/interviewKit.js";

const buildValidKit = (): InterviewKit => ({
  source: {
    jobDescription: "Backend engineer role",
    companyUrl: "https://example.com",
  },
  companyBrief: {
    overview: "A company",
    products: ["Product A"],
    industry: "Software",
    culture: ["Remote-first"],
    engineering: ["TypeScript"],
  },
  role: {
    title: "Backend Engineer",
    requirements: [
      {
        id: "r1",
        text: "Know Node.js",
        category: "technical",
        priority: "must",
      },
    ],
  },
  questions: [
    {
      id: "q1",
      question: "Explain the event loop",
      category: "technical",
      difficulty: "medium",
      requirementIds: ["r1"],
    },
  ],
  flashcards: [
    {
      id: "f1",
      questionId: "q1",
      front: "What is the event loop?",
      back: "It handles async callbacks.",
      requirementIds: ["r1"],
    },
  ],
  schedule: [
    {
      day: 1,
      focus: "Day 1",
      questionIds: ["q1"],
      durationMinutes: 20,
    },
  ],
  coverage: [{ requirementId: "r1", covered: true }],
});

describe("validateEditableInterviewKit", () => {
  it("accepts a well-formed kit", () => {
    assert.deepEqual(
      validateEditableInterviewKit(buildValidKit()),
      [],
    );
  });

  it("flags a missing role title", () => {
    const kit = buildValidKit();
    kit.role.title = "";

    const errors = validateEditableInterviewKit(kit);

    assert.ok(
      errors.some((error) => error.includes("Role title")),
    );
  });

  it("flags an invalid requirement priority", () => {
    const kit = buildValidKit();
    (kit.role.requirements[0] as { priority: string }).priority =
      "sometimes";

    const errors = validateEditableInterviewKit(kit);

    assert.ok(
      errors.some((error) => error.includes("invalid priority")),
    );
  });

  it("flags a question referencing an unknown requirement", () => {
    const kit = buildValidKit();
    kit.questions[0].requirementIds = ["does-not-exist"];

    const errors = validateEditableInterviewKit(kit);

    assert.ok(
      errors.some((error) =>
        error.includes("unknown requirement"),
      ),
    );
  });

  it("flags duplicate question IDs", () => {
    const kit = buildValidKit();
    kit.questions.push({ ...kit.questions[0] });

    const errors = validateEditableInterviewKit(kit);

    assert.ok(
      errors.some((error) => error.includes("duplicate ID")),
    );
  });

  it("flags a flashcard referencing an unknown question", () => {
    const kit = buildValidKit();
    kit.flashcards[0].questionId = "does-not-exist";

    const errors = validateEditableInterviewKit(kit);

    assert.ok(
      errors.some((error) =>
        error.includes("unknown question"),
      ),
    );
  });

  it("flags an invalid company brief", () => {
    const kit = buildValidKit();
    (kit.companyBrief as { products: unknown }).products =
      "not-an-array";

    const errors = validateEditableInterviewKit(kit);

    assert.ok(
      errors.some((error) =>
        error.includes("Company brief"),
      ),
    );
  });
});

describe("validateInterviewKit", () => {
  it("accepts a well-formed kit", () => {
    assert.deepEqual(validateInterviewKit(buildValidKit()), []);
  });

  it("flags a missing source job description", () => {
    const kit = buildValidKit();
    kit.source.jobDescription = "";

    const errors = validateInterviewKit(kit);

    assert.ok(
      errors.some((error) =>
        error.includes("job description"),
      ),
    );
  });

  it("flags a non-array schedule", () => {
    const kit = buildValidKit();
    (kit as { schedule: unknown }).schedule = null;

    const errors = validateInterviewKit(kit);

    assert.ok(
      errors.some((error) => error.includes("Schedule")),
    );
  });
});

describe("validateCompanyBrief", () => {
  it("accepts a well-formed brief", () => {
    assert.deepEqual(
      validateCompanyBrief({
        overview: "A company",
        products: [],
        industry: "Software",
        culture: [],
        engineering: [],
      }),
      [],
    );
  });

  it("accepts an empty overview and industry (the prompt allows this when research has no usable data)", () => {
    assert.deepEqual(
      validateCompanyBrief({
        overview: "",
        products: [],
        industry: "",
        culture: [],
        engineering: [],
      }),
      [],
    );
  });

  it("flags a non-string overview", () => {
    const errors = validateCompanyBrief({
      overview: 123 as unknown as string,
      products: [],
      industry: "Software",
      culture: [],
      engineering: [],
    });

    assert.ok(
      errors.some((error) => error.includes("overview")),
    );
  });

  it("flags a non-string industry", () => {
    const errors = validateCompanyBrief({
      overview: "A company",
      products: [],
      industry: null as unknown as string,
      culture: [],
      engineering: [],
    });

    assert.ok(
      errors.some((error) => error.includes("Industry")),
    );
  });
});

describe("applyCompanyBriefFallbacks", () => {
  it("leaves a fully-populated brief untouched", () => {
    const brief = {
      overview: "A company",
      products: ["Widget"],
      industry: "Software",
      culture: ["Remote-first"],
      engineering: ["TypeScript"],
    };

    assert.deepEqual(applyCompanyBriefFallbacks(brief), brief);
  });

  it("backfills empty overview and industry with safe fallback text instead of leaving them blank", () => {
    const result = applyCompanyBriefFallbacks({
      overview: "",
      products: [],
      industry: "   ",
      culture: [],
      engineering: [],
    });

    assert.equal(result.overview, NO_SOURCE_DATA_TEXT);
    assert.equal(result.industry, NO_SOURCE_DATA_TEXT);
  });

  it("does not touch products, culture, or engineering (empty arrays are a legitimate 'no info' signal)", () => {
    const result = applyCompanyBriefFallbacks({
      overview: "A company",
      products: [],
      industry: "Software",
      culture: [],
      engineering: [],
    });

    assert.deepEqual(result.products, []);
    assert.deepEqual(result.culture, []);
    assert.deepEqual(result.engineering, []);
  });
});

describe("validateJDExtraction", () => {
  it("accepts a well-formed extraction", () => {
    const errors = validateJDExtraction({
      roleTitle: "Backend Engineer",
      requirements: [
        {
          id: "r1",
          text: "Know Node.js",
          category: "technical",
          priority: "must",
        },
      ],
    });

    assert.deepEqual(errors, []);
  });

  it("flags a requirement with an invalid priority", () => {
    const errors = validateJDExtraction({
      roleTitle: "Backend Engineer",
      requirements: [
        {
          id: "r1",
          text: "Know Node.js",
          category: "technical",
          priority: "maybe" as "must" | "nice",
        },
      ],
    });

    assert.ok(
      errors.some((error) =>
        error.includes("invalid priority"),
      ),
    );
  });
});

describe("validatePracticeReviewInput", () => {
  it("accepts a valid review", () => {
    assert.deepEqual(
      validatePracticeReviewInput({
        confidence: "low",
        covered: false,
      }),
      [],
    );
  });

  it("flags an invalid confidence value", () => {
    const errors = validatePracticeReviewInput({
      confidence: "unsure" as "low" | "medium" | "high",
      covered: true,
    });

    assert.ok(errors.length > 0);
  });

  it("flags a non-boolean covered value", () => {
    const errors = validatePracticeReviewInput({
      confidence: "high",
      covered: "yes" as unknown as boolean,
    });

    assert.ok(errors.length > 0);
  });
});
