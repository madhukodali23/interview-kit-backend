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

  const pages = await crawlPages(rankedLinks);

  return {
    url: validatedUrl.toString(),
    text,
    links: rankedLinks,
    pages,
  };
};