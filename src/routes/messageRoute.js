import express from "express";
import {
  recallMessage,
  sendDirectMessage,
  sendGroupMessage,
  uploadMessageImage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/upload-image", upload.single("file"), uploadMessageImage);
router.patch("/:messageId/recall", recallMessage);
router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);

export default router;
