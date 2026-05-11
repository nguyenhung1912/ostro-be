import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
} from "../controllers/messageController.js";
import {
  checkFriendShip,
  checkGroupMemeberShip,
} from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendShip, sendDirectMessage);
router.post("/group", checkGroupMemeberShip, sendGroupMessage);

export default router;
