import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getPracticeSession,
  submitPracticeReview,
} from "../services/practice.service.js";

import {
  requireUserId,
  requireParam,
} from "../utils/httpHelpers.js";

export const getPracticeSessionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = requireUserId(req);

    const result = await getPracticeSession(
      requireParam(req, "id"),
      userId,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const submitPracticeReviewController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = requireUserId(req);

    const result = await submitPracticeReview(
      requireParam(req, "id"),
      userId,
      requireParam(req, "flashcardId"),
      req.body,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
