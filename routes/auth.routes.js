const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { redis } = require("../config/redis");
const { auth } = require("../middlewares/auth");

const authRouter = require("express").Router();

authRouter.get("/users", async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).send({ users });
  } catch (error) {
    next(error);
  }
});

authRouter.delete("/user/:id", async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) throw createError.NotFound();
    return res.status(200).send({ message: "Deleted", deletedUser });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const isUserPresent = await User.findOne({ email });
    if (isUserPresent) throw createError.Unauthorized("User already present.");

    const newUser = new User(req.body);

    await newUser.save();

    res.status(201).send({ message: "Registered.", user: newUser });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(email,password);
    const isUserPresent = await User.findOne({ email });
    if (!isUserPresent) throw createError.NotFound("User not registered.");
    const verifyPassword = await isUserPresent.isPasswordValid(password);

    if (!verifyPassword) throw createError.Unauthorized("Invalid credentials.");
    // Generate jwt token
    const access_token = jwt.sign(
      { userId: isUserPresent._id, email, role: isUserPresent.role },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "1m" }
    );
    const refresh_token = jwt.sign(
      { userId: isUserPresent._id, email, role: isUserPresent.role },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "3m" }
    );

    res.cookie("access_token", access_token, {
      maxAge: 1000 * 60 * 3, // ms * sec * min
      httpOnly: true,
      sameSite: "Lax",
      signed: true,
    });
    res.cookie("refresh_token", refresh_token, {
      maxAge: 1000 * 60 * 6, // ms * sec * min
      httpOnly: true,
      sameSite: "Lax",
      signed: true,
    });
    res.header("Access-Control-Allow-Credentials", "true");
    res.status(200).send({ message: "Login success."});
  } catch (error) {
    next(error);
  }
});

authRouter.get("/logout", auth, async (req, res, next) => {
  try {
    // check if token is blacklisted : logic here
    const access_token = req?.cookies?.access_token;
    const refresh_token = req?.cookies?.refresh_token;
    if (access_token || refresh_token) {
      await redis.set(access_token, "blacklisted", "EX", 10 * 60);
      await redis.set(refresh_token, "blacklisted", "EX", 10 * 60);
    }
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.status(204).send({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/refresh-token", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) throw createError.Unauthorized();
    const isTokenValid = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
    if (!isTokenValid) throw createError.Unauthorized("Please login again.");
    const { userId, email, role, ...rest } = isTokenValid; // userId and email from refreshToken payload
    const newAccessToken = jwt.sign(
      { userId, email, role },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "1m" }
    );
    const newRefreshToken = jwt.sign(
      { userId, email, role },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "3m" }
    );
    res.cookie("access_token", newAccessToken, {
      maxAge: 1000 * 60 * 3, // ms * sec * min
      httpOnly: true,
      sameSite: "strict",
    });
    res.cookie("refresh_token", newRefreshToken, {
      maxAge: 1000 * 60 * 6, // ms * sec * min
      httpOnly: true,
      sameSite: "strict",
    });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = { authRouter };
