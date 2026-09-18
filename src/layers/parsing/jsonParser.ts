export const parseJsonResponse = <T>(content: string): T => {
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("LLM returned invalid JSON");
  }
};