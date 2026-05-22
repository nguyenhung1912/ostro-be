import express from "express";
import {
  authMe,
  changePassword,
  deleteAccount,
  searchUserByUsername,
  uploadAvatar,
  uploadCover,
  updateProfile,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";
const router = express.Router();

router.get("/me", authMe);
router.patch("/me", updateProfile);
router.patch("/password", changePassword);
router.delete("/me", deleteAccount);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.post("/uploadCover", upload.single("file"), uploadCover);

export default router;
