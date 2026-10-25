import rateLimit from "express-rate-limit";

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 20, // Tối đa 20 yêu cầu mỗi phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Bạn đã vượt quá giới hạn yêu cầu AI. Vui lòng thử lại sau 1 phút.",
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 phút
  max: 15, // Tối đa 15 lần thử mỗi 5 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 5 phút.",
  },
});
