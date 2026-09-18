import { Request, Response, NextFunction } from "express";
import {
  InterviewKitInput,
  validateInterviewKitInput,
} from "../layers/validation/interviewKit.validation.js";
import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { createInterviewKit } from "../services/interviewKit.service.js";

export const createInterviewKitController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = req.body as InterviewKitInput;

    const errors = validateInterviewKitInput(input);

    if (errors.length > 0) {
      throw new AppError(
        ERROR_CODES.INVALID_REQUEST,
        errors.join(", "),
        400,
      );
    }

    const result = createInterviewKit(input);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};