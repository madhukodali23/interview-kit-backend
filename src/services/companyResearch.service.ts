import { validateCompanyUrl } from "../layers/security/urlValidator.js";
import { fetchPage } from "../infrastructure/web/httpClient.js";
import { cleanHtml } from "../infrastructure/web/htmlCleaner.js";
import { discoverLinks } from "../infrastructure/web/linkDiscovery.js";
import { rankLinks } from "../infrastructure/web/linkRanker.js";
import { crawlPages } from "../infrastructure/web/pageCrawler.js";

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
 * Turns skipped/unreachable secondary research pages into human-readable
 * warnings so the failure is reported on the kit instead of silently lost.
 * The primary company URL itself is never "skipped" this way: if it is
 * unreachable, researchCompany throws and the whole run fails, since there
 * is nothing to build a company brief from.
 */
export const buildResearchWarnings = (
  research: CompanyResearchResult,
): string[] => {
  return research.skippedPages.map(
    (page) => `Skipped ${page.url}: ${page.reason}`,
  );
};
