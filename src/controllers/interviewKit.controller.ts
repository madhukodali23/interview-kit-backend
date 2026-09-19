import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createInterviewKit,
  CreateInterviewKitInput,
} from "../services/createInterviewKit.service.js";

import {
  getMyInterviewKitById,
  getMyInterviewKits,
  updateMyInterviewKit,
  deleteMyInterviewKit,
  addQuestion,
  editQuestion,
  deleteQuestion,
  reorderQuestions,
  addFlashcard,
  editFlashcard,
  deleteFlashcard,
  reorderFlashcards,
  editRequirement,
  editCompanyBrief,
  regenerateQuestions,
  regenerateFlashcards,
  regenerateCompanyBrief,
} from "../services/interviewKit.service.js";

import {
  validateInterviewKitInput,
} from "../layers/validation/interviewKit.validation.js";

import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { ERROR_MESSAGES } from "../errors/errorMessages.js";

import {
  requireUserId,
  requireParam,
} from "../utils/httpHelpers.js";

export const createInterviewKitController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const input =
        req.body as CreateInterviewKitInput;

      const errors =
        validateInterviewKitInput(input);

      if (errors.length > 0) {
        throw new AppError(
          ERROR_CODES.INVALID_REQUEST,
          `${ERROR_MESSAGES.INVALID_REQUEST}: ${errors.join(", ")}`,
          400,
        );
      }

      const userId =
        requireUserId(req);

      const kit =
        await createInterviewKit(
          input,
          userId,
        );

      res.status(201).json({
        success: true,
        data: kit,
      });
    } catch (error) {
      next(error);
    }
  };

export const getMyInterviewKitsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const kits =
        await getMyInterviewKits(
          userId,
        );

      res.json({
        success: true,
        data: kits,
      });
    } catch (error) {
      next(error);
    }
  };

export const getMyInterviewKitByIdController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const kit =
        await getMyInterviewKitById(
          requireParam(req, "id"),
          userId,
        );

      res.json({
        success: true,
        data: kit,
      });
    } catch (error) {
      next(error);
    }
  };

export const updateMyInterviewKitController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const updatedKit =
        await updateMyInterviewKit(
          requireParam(req, "id"),
          userId,
          req.body,
        );

      res.json({
        success: true,
        data: updatedKit,
      });
    } catch (error) {
      next(error);
    }
  };

export const deleteMyInterviewKitController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      await deleteMyInterviewKit(
        requireParam(req, "id"),
        userId,
      );

      res.json({
        success: true,
        message:
          "Interview kit deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

/* ------------------------------- QUESTIONS ------------------------------- */

export const addQuestionController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await addQuestion(
          requireParam(req, "id"),
          userId,
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

export const editQuestionController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await editQuestion(
          requireParam(req, "id"),
          userId,
          requireParam(req, "questionId"),
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

export const deleteQuestionController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await deleteQuestion(
          requireParam(req, "id"),
          userId,
          requireParam(req, "questionId"),
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

export const reorderQuestionsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const { questionIds } =
        req.body;

      if (!Array.isArray(questionIds)) {
        throw new AppError(
          ERROR_CODES.INVALID_REQUEST,
          "questionIds must be an array",
          400,
        );
      }

      const result =
        await reorderQuestions(
          requireParam(req, "id"),
          userId,
          questionIds,
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

/* ------------------------------ FLASHCARDS ------------------------------- */

export const addFlashcardController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await addFlashcard(
          requireParam(req, "id"),
          userId,
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

export const editFlashcardController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await editFlashcard(
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

export const deleteFlashcardController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await deleteFlashcard(
          requireParam(req, "id"),
          userId,
          requireParam(req, "flashcardId"),
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

export const reorderFlashcardsController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const { flashcardIds } =
        req.body;

      if (!Array.isArray(flashcardIds)) {
        throw new AppError(
          ERROR_CODES.INVALID_REQUEST,
          "flashcardIds must be an array",
          400,
        );
      }

      const result =
        await reorderFlashcards(
          requireParam(req, "id"),
          userId,
          flashcardIds,
        );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

/* ----------------------------- REQUIREMENTS ------------------------------ */

export const editRequirementController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await editRequirement(
          requireParam(req, "id"),
          userId,
          requireParam(req, "requirementId"),
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

/* ---------------------------- COMPANY BRIEF ----------------------------- */

export const editCompanyBriefController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const result =
        await editCompanyBrief(
          requireParam(req, "id"),
          userId,
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

/* ----------------------------- REGENERATION ----------------------------- */

export const regenerateSectionController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId =
        requireUserId(req);

      const section =
        req.params.section;

      let result;

      switch (section) {
        case "questions":
          result =
            await regenerateQuestions(
              requireParam(req, "id"),
              userId,
            );
          break;

        case "flashcards":
          result =
            await regenerateFlashcards(
              requireParam(req, "id"),
              userId,
            );
          break;

        case "company-brief":
          result =
            await regenerateCompanyBrief(
              requireParam(req, "id"),
              userId,
            );
          break;

        default:
          throw new AppError(
            ERROR_CODES.INVALID_REQUEST,
            "Unsupported regeneration section",
            400,
          );
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };