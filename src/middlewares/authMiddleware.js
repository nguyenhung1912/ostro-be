import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = async (req, res, next) => {
  try {
    // get token from header
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ message: "Access token not found" });
    }

    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

    if (!accessTokenSecret) {
      throw new Error("ACCESS_TOKEN_SECRET is required");
    }

    // validate token
    let decodedUser;

    try {
      decodedUser = jwt.verify(token, accessTokenSecret);
    } catch {
      return res
        .status(403)
        .json({ message: "Access token expired or invalid" });
    }

    // find user
    const user = await User.findById(decodedUser.userId)
      .select("-hashedPassword")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // attach user to req
    req.user = user;
    return next();
  } catch (error) {
    console.error("Error verifying JWT in auth middleware", error);
    return res.status(500).json({ message: "System error" });
  }
};
