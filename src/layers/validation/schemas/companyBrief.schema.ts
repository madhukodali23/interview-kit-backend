import { CompanyBrief } from "../../../services/companyBrief.service.js";

export const validateCompanyBrief = (
  brief: CompanyBrief,
): string[] => {
  const errors: string[] = [];

  if (!brief.overview?.trim()) {
    errors.push("Company overview is required");
  }

  if (!Array.isArray(brief.products)) {
    errors.push("Products must be an array");
  }

  if (!brief.industry?.trim()) {
    errors.push("Industry is required");
  }

  if (!Array.isArray(brief.culture)) {
    errors.push("Culture must be an array");
  }

  if (!Array.isArray(brief.engineering)) {
    errors.push("Engineering information must be an array");
  }

  return errors;
};