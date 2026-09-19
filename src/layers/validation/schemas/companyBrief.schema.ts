import { CompanyBrief } from "../../../types/interviewKit/companyBrief.js";

/**
 * This checks structural/type validity only. The company brief prompt
 * explicitly instructs the model to return an empty string or empty array
 * when information is unavailable (e.g. the company site had little usable
 * content) — that is a legitimate, structurally valid response, not an
 * error. Rejecting it here would mean any thin/uncooperative company source
 * fails the entire kit generation.
 *
 * The stricter "must be genuinely non-empty" business rule is enforced
 * separately, after `generateCompanyBrief` backfills safe fallback text for
 * any empty fields (see companyBrief.service.ts), by
 * `validateEditableInterviewKit` in builder.validation.ts.
 */
export const validateCompanyBrief = (
  brief: CompanyBrief,
): string[] => {
  const errors: string[] = [];

  if (!brief || typeof brief !== "object") {
    return ["Company brief must be an object"];
  }

  if (typeof brief.overview !== "string") {
    errors.push("Company overview must be a string");
  }

  if (!Array.isArray(brief.products)) {
    errors.push("Products must be an array");
  }

  if (typeof brief.industry !== "string") {
    errors.push("Industry must be a string");
  }

  if (!Array.isArray(brief.culture)) {
    errors.push("Culture must be an array");
  }

  if (!Array.isArray(brief.engineering)) {
    errors.push(
      "Engineering information must be an array",
    );
  }

  return errors;
};
