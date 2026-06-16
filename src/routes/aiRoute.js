import express from "express";
import {
  summarizeConversation,
  generateGroupTitle,
  extractActionItems,
  improveMessage,
  translateMessage,
} from "../controllers/aiController.js";
const router = express.Router();

router.post("/summarize", summarizeConversation);
router.post("/title", generateGroupTitle);
router.post("/actions", extractActionItems);
router.post("/improve", improveMessage);
router.post("/translate", translateMessage);

export default router;
