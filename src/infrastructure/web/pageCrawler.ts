import { fetchPage } from "./httpClient.js";
import { cleanHtml } from "./htmlCleaner.js";
import { DiscoveredLink } from "./linkDiscovery.js";
import { limits } from "../../config/limits.js";

export interface CrawledPage {
  url: string;
  text: string;
}

export interface SkippedPage {
  url: string;
  reason: string;
}

export interface CrawlResult {
  pages: CrawledPage[];
  skipped: SkippedPage[];
}

export const crawlPages = async (
  links: DiscoveredLink[],
): Promise<CrawlResult> => {
  const selectedLinks = links.slice(0, limits.maxResearchPages);

  const pages: CrawledPage[] = [];
  const skipped: SkippedPage[] = [];

  for (const link of selectedLinks) {
    try {
      const html = await fetchPage(link.url);

      pages.push({
        url: link.url,
        text: cleanHtml(html),
      });
    } catch (error) {
      skipped.push({
        url: link.url,
        reason:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
    }
  }

  return { pages, skipped };
};
