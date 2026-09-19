import { Request } from "express";

import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

export const requireUserId = (req: Request): string => {
  if (!req.session.userId) {
    throw new AppError(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES.UNAUTHORIZED,
      401,
    );
  }

  return req.session.userId;
};

export const requireParam = (
  req: Request,
  name: string,
): string => {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new AppError(
      ERROR_CODES.INVALID_REQUEST,
      ERROR_MESSAGES.INVALID_REQUEST,
      400,
    );
  }

  return value;
};
