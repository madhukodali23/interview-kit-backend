import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import interviewKitRoutes from "./routes/interviewKit.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(errorMiddleware);
app.use("/api/interview-kits", interviewKitRoutes);
app.use("/api/health", healthRoutes);

app.listen(env.PORT, () => {
  console.log(`Backend running on http://localhost:${env.PORT}`);
});