import { fetchPage } from "./httpClient.js";
import { cleanHtml } from "./htmlCleaner.js";
import { DiscoveredLink } from "./linkDiscovery.js";
import { limits } from "../../config/limits.js";

export interface CrawledPage {
  url: string;
  text: string;
}

export const crawlPages = async (
  links: DiscoveredLink[],
): Promise<CrawledPage[]> => {
  const selectedLinks = links.slice(0, limits.maxResearchPages);

  const pages: CrawledPage[] = [];

  for (const link of selectedLinks) {
    try {
      const html = await fetchPage(link.url);

      pages.push({
        url: link.url,
        text: cleanHtml(html),
      });
    } catch {
      // Skip unreachable pages.
    }
  }

  return pages;
};