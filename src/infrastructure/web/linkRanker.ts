import { DiscoveredLink } from "./linkDiscovery.js";

const PRIORITY_KEYWORDS = [
  "career",
  "careers",
  "jobs",
  "hiring",
  "about",
  "company",
  "engineering",
  "culture",
];

export const rankLinks = (
  links: DiscoveredLink[],
): DiscoveredLink[] => {
  return [...links].sort((a, b) => {
    const scoreA = getLinkScore(a);
    const scoreB = getLinkScore(b);

    return scoreB - scoreA;
  });
};

const getLinkScore = (link: DiscoveredLink): number => {
  const value = `${link.text} ${link.url}`.toLowerCase();

  return PRIORITY_KEYWORDS.reduce((score, keyword) => {
    return value.includes(keyword) ? score + 1 : score;
  }, 0);
};