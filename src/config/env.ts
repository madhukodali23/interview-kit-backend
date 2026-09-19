import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV || "development";

const PORT = Number(process.env.PORT) || 5000;

const OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY;

const LLM_MODEL =
  process.env.LLM_MODEL || "openrouter/free";

const MONGODB_URI = process.env.MONGODB_URI;

const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.warn("SESSION_SECRET is not configured");
}

export const env = {
  NODE_ENV,
  PORT,
  OPENROUTER_API_KEY,
  LLM_MODEL,
  MONGODB_URI,
  SESSION_SECRET,
};