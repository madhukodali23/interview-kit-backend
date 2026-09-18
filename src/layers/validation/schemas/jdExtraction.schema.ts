import { JobDescriptionExtraction } from "../../../services/jdExtraction.service.js";

export const validateJDExtraction = (
  result: JobDescriptionExtraction,
): string[] => {
  const errors: string[] = [];

  if (!result.roleTitle?.trim()) {
    errors.push("Role title is required");
  }

  if (!Array.isArray(result.requirements)) {
    errors.push("Requirements must be an array");
    return errors;
  }

  result.requirements.forEach((requirement, index) => {
    if (!requirement.id?.trim()) {
      errors.push(`Requirement ${index + 1} is missing an ID`);
    }

    if (!requirement.text?.trim()) {
      errors.push(`Requirement ${index + 1} is missing text`);
    }

    if (!["must", "nice"].includes(requirement.priority)) {
      errors.push(
        `Requirement ${index + 1} has invalid priority`,
      );
    }
  });

  return errors;
};