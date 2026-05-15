import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/database.js";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import { app, server } from "./socket/index.js";

dotenv.config();

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Biến môi trường ${name} là bắt buộc`);
  }

  return value;
};

let clientUrl;

try {
  getRequiredEnv("MONGODB_CONNECTION_STRING");
  getRequiredEnv("ACCESS_TOKEN_SECRET");
  clientUrl = getRequiredEnv("CLIENT_URL");
} catch (error) {
  console.error("Lỗi cấu hình khởi động:", error.message);
  process.exit(1);
}

const PORT = process.env.PORT || 5001;

// middlewares
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(cors({ origin: clientUrl, credentials: true }));

// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);

// graceful shutdown
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server đã khởi động trên cổng ${PORT}`);
  });

  const shutdown = () => {
    console.log("Đang tắt server...");
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

startServer().catch((err) => {
  console.error("Không thể khởi động server:", err);
  process.exit(1);
});
