import "dotenv/config";

const PORT = Number(process.env.PORT) || 5000;

const LLM_API_KEY = process.env.LLM_API_KEY;

if (!LLM_API_KEY) {
  console.warn("LLM_API_KEY is not configured");
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || "openrouter/free";

export const env = {
  PORT,
  OPENROUTER_API_KEY,
  LLM_MODEL,
};