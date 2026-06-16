import express from "express";
import {
  getAllUsers,
  updateUserRole,
  toggleUserBan,
  deleteUser,
  getAllGroups,
  deleteGroup,
  getAnalytics,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", getAllUsers);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/ban", toggleUserBan);
router.delete("/users/:userId", deleteUser);

router.get("/groups", getAllGroups);
router.delete("/groups/:groupId", deleteGroup);

router.get("/analytics", getAnalytics);

export default router;
