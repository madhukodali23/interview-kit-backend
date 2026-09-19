import { Router } from "express";

import {
  createInterviewKitController,
  getMyInterviewKitByIdController,
  getMyInterviewKitsController,
  updateMyInterviewKitController,
  deleteMyInterviewKitController,
  addQuestionController,
  editQuestionController,
  deleteQuestionController,
  reorderQuestionsController,
  addFlashcardController,
  editFlashcardController,
  deleteFlashcardController,
  reorderFlashcardsController,
  editRequirementController,
  editCompanyBriefController,
  regenerateSectionController,
} from "../controllers/interviewKit.controller.js";

import {
  getPracticeSessionController,
  submitPracticeReviewController,
} from "../controllers/practice.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  createInterviewKitController,
);

router.get(
  "/",
  requireAuth,
  getMyInterviewKitsController,
);

router.get(
  "/:id",
  requireAuth,
  getMyInterviewKitByIdController,
);

router.put(
  "/:id",
  requireAuth,
  updateMyInterviewKitController,
);

router.delete(
  "/:id",
  requireAuth,
  deleteMyInterviewKitController,
);

/* ------------------------------- QUESTIONS ------------------------------- */

router.post(
  "/:id/questions",
  requireAuth,
  addQuestionController,
);

router.patch(
  "/:id/questions/:questionId",
  requireAuth,
  editQuestionController,
);

router.delete(
  "/:id/questions/:questionId",
  requireAuth,
  deleteQuestionController,
);

router.put(
  "/:id/questions/reorder",
  requireAuth,
  reorderQuestionsController,
);

/* ------------------------------ FLASHCARDS ------------------------------- */

router.post(
  "/:id/flashcards",
  requireAuth,
  addFlashcardController,
);

router.patch(
  "/:id/flashcards/:flashcardId",
  requireAuth,
  editFlashcardController,
);

router.delete(
  "/:id/flashcards/:flashcardId",
  requireAuth,
  deleteFlashcardController,
);

router.put(
  "/:id/flashcards/reorder",
  requireAuth,
  reorderFlashcardsController,
);

/* ----------------------------- REQUIREMENTS ------------------------------ */

router.patch(
  "/:id/requirements/:requirementId",
  requireAuth,
  editRequirementController,
);

/* ---------------------------- COMPANY BRIEF ----------------------------- */

router.patch(
  "/:id/company-brief",
  requireAuth,
  editCompanyBriefController,
);

/* ----------------------------- REGENERATION ----------------------------- */

router.post(
  "/:id/regenerate/:section",
  requireAuth,
  regenerateSectionController,
);

/* ------------------------------- PRACTICE -------------------------------- */

router.get(
  "/:id/practice",
  requireAuth,
  getPracticeSessionController,
);

router.post(
  "/:id/practice/:flashcardId/review",
  requireAuth,
  submitPracticeReviewController,
);

export default router;
