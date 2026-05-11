import express from "express";
import {
  createConversation,
  getConversation,
  getMessages,
} from "../controllers/conversationController.js";
import { checkFriendShip } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendShip, createConversation);
router.post("/", getConversation);
router.post("/:conversationId/messages", getMessages);

export default router;
