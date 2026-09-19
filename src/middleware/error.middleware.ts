import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(`[${error.code}]`, error.message);
    }

    res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error("Unhandled error:", error);

  res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  });
};