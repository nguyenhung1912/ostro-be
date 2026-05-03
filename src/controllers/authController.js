import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30s";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message: "username, password, email, firstName, lastName is required",
      });
    }

    // check if the username already exists
    const duplicate = await User.findOne({ username });

    if (duplicate) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (err) {
    console.error("Failed to call signUp", err);
    return res.status(500).json({ message: "System error" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    // get input from req
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // get hashedPassword from DB to compare with input password
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // check password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // if match, create access token with JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    // create refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // create new session to store refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // return refresh token in cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    // return access token in response
    return res.status(200).json({
      message: `User ${user.displayName} is logged in!`,
      accessToken,
    });
  } catch (err) {
    console.error("Failed to call signIn", err);
    return res.status(500).json({ message: "System error" });
  }
};

export const signOut = async (req, res) => {
  try {
    // get refresh token from cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // delete refresh token in session
      await Session.deleteOne({ refreshToken: token });

      // delete refresh token in cookie
      res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);
  } catch (err) {
    console.error("Failed to call signOut", err);
    return res.status(500).json({ message: "System error" });
  }
};

// create new access token from refresh token
export const refreshToken = async (req, res) => {
  try {
    // get refresh token from cookie
    const token = req.cookie?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Token does not exits" });
    }

    // compare refresh token in db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Invalid Token or Expired" });
    }

    // check if it has expired
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token has expired." });
    }

    // create new access token
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("Failed to call refreshToken", err);
    return res.status(500).json({ message: "System error" });
  }
};
