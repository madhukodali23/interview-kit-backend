import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";

const hasHttpStatus = (
  error: unknown,
): error is { status: number; message?: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  );
};

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

  /**
   * Express's body parser (malformed JSON, payload too large, wrong
   * content-type) throws plain errors with a numeric `.status` in the 4xx
   * range. Without this, those leaked through as a generic 500.
   */
  if (
    hasHttpStatus(error) &&
    error.status >= 400 &&
    error.status < 500
  ) {
    res.status(error.status).json({
      success: false,
      code: "INVALID_REQUEST",
      message: error.message || "Invalid request",
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
