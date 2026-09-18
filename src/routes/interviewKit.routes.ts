import { Router } from "express";
import { createInterviewKitController } from "../controllers/interviewKit.controller.js";

const router = Router();

router.post("/", createInterviewKitController);

export default router;