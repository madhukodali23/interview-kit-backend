import {
  researchCompany,
  buildResearchWarnings,
} from "./companyResearch.service.js";
import {
  generateCompanyBrief,
  NO_SOURCE_DATA_TEXT,
} from "./companyBrief.service.js";
import { searchInterviewDiscussions } from "../infrastructure/search/interviewDiscussionSearch.js";
import { CompanyBrief } from "../types/interviewKit/companyBrief.js";

export interface ResearchResult {
  companyResearch: Awaited<ReturnType<typeof researchCompany>>;
  companyBrief: CompanyBrief;
  interviewDiscussions: Awaited<
    ReturnType<typeof searchInterviewDiscussions>
  >;
  warnings: string[];
}

const buildFallbackCompanyBrief = (): CompanyBrief => ({
  overview: NO_SOURCE_DATA_TEXT,
  products: [],
  industry: NO_SOURCE_DATA_TEXT,
  culture: [],
  engineering: [],
});

const describeFailure = (error: unknown): string => {
  return error instanceof Error
    ? error.message
    : "Unknown error";
};

export const runResearch = async (
  companyUrl: string,
  role: string,
): Promise<ResearchResult> => {
  const companyResearch = await researchCompany(companyUrl);

  const researchText = [
    companyResearch.text,
    ...companyResearch.pages.map((page) => page.text),
  ].join("\n\n");

  const warnings = buildResearchWarnings(companyResearch);

  /**
   * Company brief generation is one more research source that can fail
   * (an uncooperative/garbled LLM response, a rate limit, etc.) — like an
   * unreachable secondary page, that must not take down the whole kit.
   * Fall back to safe, explicit "not available" values and report why,
   * rather than aborting generation entirely.
   */
  let companyBrief: CompanyBrief;

  try {
    companyBrief = await generateCompanyBrief(researchText);
  } catch (error) {
    warnings.push(
      `Company brief generation failed, using fallback values: ${describeFailure(error)}`,
    );
    companyBrief = buildFallbackCompanyBrief();
  }

  const interviewDiscussions =
    await searchInterviewDiscussions(
      "",
      role,
    );

  return {
    companyResearch,
    companyBrief,
    interviewDiscussions,
    warnings,
  };
};
