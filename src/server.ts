import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import healthRoutes from "./routes/health.routes.js";
import interviewKitRoutes from "./routes/interviewKit.routes.js";
import authRoutes from "./routes/auth.routes.js";

import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

if (!env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not configured",
  );
}

if (!env.MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not configured",
  );
}

if (!env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY is not configured",
  );
}

app.use(
  session({
    secret: env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use(
  "/api/interview-kits",
  interviewKitRoutes,
);

app.use(errorMiddleware);

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(
      `Backend running on http://localhost:${env.PORT}`,
    );
  });
};

startServer().catch((error) => {
  console.error(
    "Failed to start server:",
    error,
  );

  process.exit(1);
});