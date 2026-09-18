import { researchCompany } from "./companyResearch.service.js";
import { generateCompanyBrief } from "./companyBrief.service.js";
import { searchInterviewDiscussions } from "../infrastructure/search/interviewDiscussionSearch.js";

export interface ResearchResult {
  companyResearch: Awaited<ReturnType<typeof researchCompany>>;
  companyBrief: Awaited<ReturnType<typeof generateCompanyBrief>>;
  interviewDiscussions: Awaited<
    ReturnType<typeof searchInterviewDiscussions>
  >;
}

export const runResearch = async (
  companyUrl: string,
  role: string,
) => {
  const companyResearch = await researchCompany(companyUrl);

  const researchText = [
    companyResearch.text,
    ...companyResearch.pages.map((page) => page.text),
  ].join("\n\n");

  const companyBrief = await generateCompanyBrief(
    researchText,
  );

  const interviewDiscussions =
    await searchInterviewDiscussions(
      "",
      role,
    );

  return {
    companyResearch,
    companyBrief,
    interviewDiscussions,
  };
};