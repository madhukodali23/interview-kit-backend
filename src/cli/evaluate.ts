import { readFile, writeFile } from "node:fs/promises";

import { env } from "../config/env.js";
import {
  buildInterviewKit,
  CreateInterviewKitInput,
} from "../services/createInterviewKit.service.js";
import { InterviewKit } from "../types/interviewKit/interviewKit.js";
import { AppError } from "../errors/AppError.js";

interface EvaluationCase {
  id?: string;
  jobDescription: string;
  companyUrl: string;
  days: number;
}

interface EvaluationResult {
  id: string;
  status: "success" | "failure";
  kit?: InterviewKit;
  error?: string;
}

interface CliArgs {
  input: string;
  output: string;
}

const parseArgs = (argv: string[]): CliArgs => {
  const values = new Map<string, string>();

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      values.set(key, value);
      i++;
    }
  }

  const input = values.get("input");
  const output = values.get("output");

  if (!input || !output) {
    console.error(
      "Usage: npm run evaluate -- --input <cases.json> --output <kits.json>",
    );
    process.exit(1);
  }

  return { input, output };
};

const loadCases = async (
  inputPath: string,
): Promise<EvaluationCase[]> => {
  const raw = await readFile(inputPath, "utf-8");
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Input file must contain a JSON array of evaluation cases",
    );
  }

  return parsed as EvaluationCase[];
};

const describeError = (error: unknown): string => {
  if (error instanceof AppError) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

const runCase = async (
  testCase: EvaluationCase,
  caseId: string,
): Promise<EvaluationResult> => {
  try {
    const input: CreateInterviewKitInput = {
      jobDescription: testCase.jobDescription,
      companyUrl: testCase.companyUrl,
      days: testCase.days,
    };

    const kit = await buildInterviewKit(input);

    return { id: caseId, status: "success", kit };
  } catch (error) {
    return {
      id: caseId,
      status: "failure",
      error: describeError(error),
    };
  }
};

const run = async (): Promise<void> => {
  if (!env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not configured");
    process.exit(1);
  }

  const { input, output } = parseArgs(process.argv.slice(2));

  const cases = await loadCases(input);

  const results: EvaluationResult[] = [];

  // Cases run sequentially and each failure is caught individually, so one
  // bad case never stops the rest of the batch from being evaluated.
  for (let index = 0; index < cases.length; index++) {
    const testCase = cases[index];
    const caseId = testCase.id ?? `case-${index + 1}`;

    console.log(`Running ${caseId}...`);

    const result = await runCase(testCase, caseId);

    results.push(result);

    if (result.status === "success") {
      console.log(`  done: ${caseId} succeeded`);
    } else {
      console.error(`  failed: ${caseId}: ${result.error}`);
    }
  }

  await writeFile(
    output,
    JSON.stringify(results, null, 2),
    "utf-8",
  );

  const succeeded = results.filter(
    (result) => result.status === "success",
  ).length;

  console.log(
    `\n${succeeded}/${results.length} cases succeeded. Results written to ${output}`,
  );

  if (succeeded < results.length) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error("Evaluation run failed:", error);
  process.exit(1);
});
