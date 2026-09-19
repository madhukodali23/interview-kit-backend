import {
  Request,
  Response,
  NextFunction,
} from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.session.userId) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });

    return;
  }

  next();
};