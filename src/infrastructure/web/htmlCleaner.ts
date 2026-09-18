import * as cheerio from "cheerio";

export const cleanHtml = (html: string): string => {
  const $ = cheerio.load(html);

  $("script, style, noscript, nav, footer").remove();

  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
};