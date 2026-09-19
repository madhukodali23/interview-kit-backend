import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(env.MONGODB_URI);

  console.log("MongoDB connected");
};