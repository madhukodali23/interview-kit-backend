import { validateCompanyUrl } from "../layers/security/urlValidator.js";
import { fetchPage } from "../infrastructure/web/httpClient.js";
import { cleanHtml } from "../infrastructure/web/htmlCleaner.js";
import { discoverLinks } from "../infrastructure/web/linkDiscovery.js";
import { rankLinks } from "../infrastructure/web/linkRanker.js";
import { crawlPages } from "../infrastructure/web/pageCrawler.js";
import { limits } from "../config/limits.js";

export interface CompanyResearchResult {
  url: string;
  text: string;
  links: {
    url: string;
    text: string;
  }[];
  pages: {
    url: string;
    text: string;
  }[];
  skippedPages: {
    url: string;
    reason: string;
  }[];
}

export const researchCompany = async (
  companyUrl: string,
): Promise<CompanyResearchResult> => {
  const validatedUrl = validateCompanyUrl(companyUrl);

  const html = await fetchPage(validatedUrl.toString());

  const text = cleanHtml(html);

  const discoveredLinks = discoverLinks(
    html,
    validatedUrl.toString(),
  );

  const rankedLinks = rankLinks(discoveredLinks);

  const { pages, skipped } = await crawlPages(rankedLinks);

  return {
    url: validatedUrl.toString(),
    text,
    links: rankedLinks,
    pages,
    skippedPages: skipped,
  };
};

/**
 * Turns research-quality problems into human-readable warnings so they are
 * reported on the kit instead of silently lost or (worse) causing the whole
 * run to fail:
 *  - skipped/unreachable secondary pages
 *  - a company site that loaded but yielded too little usable content to
 *    reliably ground a company brief (the brief will fall back to safe
 *    "not available" text for any field the model couldn't fill in)
 *
 * The primary company URL itself is never "skipped" this way: if it is
 * unreachable, researchCompany throws and the whole run fails, since there
 * is nothing at all to build a company brief from.
 */
export const buildResearchWarnings = (
  research: CompanyResearchResult,
): string[] => {
  const warnings = research.skippedPages.map(
    (page) => `Skipped ${page.url}: ${page.reason}`,
  );

  const combinedLength =
    research.text.length +
    research.pages.reduce(
      (sum, page) => sum + page.text.length,
      0,
    );

  if (combinedLength < limits.minUsefulResearchLength) {
    warnings.push(
      `Company research for ${research.url} yielded very little usable content; the company brief may rely on fallback values.`,
    );
  }

  return warnings;
};
