import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  deleteConversation,
  renameConversation,
  addGroupMembers,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.delete("/:conversationId", deleteConversation);
router.patch("/:conversationId/rename", renameConversation);
router.patch("/:conversationId/add-members", checkFriendship, addGroupMembers);

export default router;
