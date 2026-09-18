import * as cheerio from "cheerio";

export interface DiscoveredLink {
  url: string;
  text: string;
}

export const discoverLinks = (
  html: string,
  baseUrl: string,
): DiscoveredLink[] => {
  const $ = cheerio.load(html);
  const links: DiscoveredLink[] = [];

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");
    const text = $(element).text().trim();

    if (!href) return;

    try {
      const url = new URL(href, baseUrl);

      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return;
      }

      links.push({
        url: url.toString(),
        text,
      });
    } catch {
      // Ignore invalid links.
    }
  });

  return links;
};