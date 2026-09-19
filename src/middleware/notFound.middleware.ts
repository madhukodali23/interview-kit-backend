import { Request, Response } from "express";

/**
 * Catches any request that didn't match a route. Without this, Express
 * falls back to its default HTML 404 page, which breaks the API's
 * consistent JSON error contract.
 */
export const notFoundMiddleware = (
  _req: Request,
  res: Response,
) => {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: "Route not found",
  });
};
