import express from "express";
import {
  summarizeConversation,
  generateGroupTitle,
  extractActionItems,
  improveMessage,
  translateMessage,
} from "../controllers/aiController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(protectedRoute);

router.post("/summarize", summarizeConversation);
router.post("/title", generateGroupTitle);
router.post("/actions", extractActionItems);
router.post("/improve", improveMessage);
router.post("/translate", translateMessage);

export default router;
