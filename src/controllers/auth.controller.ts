import {
  Request,
  Response,
  NextFunction,
} from "express";
import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/auth.service.js";

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (
  password: string,
): boolean => {
  return password.length >= 8;
};

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
      return;
    }

    if (!isValidPassword(password)) {
      res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters",
      });
      return;
    }

    const user = await registerUser(
      email,
      password,
    );

    res.status(201).json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const user = await loginUser(
      email,
      password,
    );

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    req.session.userId = user._id.toString();

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("connect.sid");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });
};

export const sessionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    const user = await getUserById(
      req.session.userId,
    );

    if (!user) {
      req.session.destroy(() => undefined);

      res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};