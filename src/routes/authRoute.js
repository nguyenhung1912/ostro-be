import express from "express";
import {
  refreshToken,
  signIn,
  signOut,
  signUp,
  googleSignIn,
} from "../controllers/authController.js";
import { authRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();

router.post("/signup", signUp);

router.post("/signin", authRateLimiter, signIn);

router.post("/google", googleSignIn);

router.post("/signout", signOut);

router.post("/refresh", refreshToken);

export default router;
