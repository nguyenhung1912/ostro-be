import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  deleteConversation,
  renameConversation,
  addGroupMembers,
  togglePinConversation,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import { leaveGroup } from "../controllers/groupConversationController.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.delete("/:conversationId", deleteConversation);
router.patch("/:conversationId/rename", renameConversation);
router.patch("/:conversationId/pin", togglePinConversation);
router.patch("/:conversationId/add-members", checkFriendship, addGroupMembers);
router.post("/:conversationId/leave", leaveGroup);

export default router;
