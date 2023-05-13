const { User } = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const createError = require("http-errors");

const authRouter = require("express").Router();

authRouter.get("/users", async (req, res, next) => {
  try {
    const users = await User.find();
    console.log(req.cookies);
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
    const isUserPresent = await User.findOne({ email });
    if (!isUserPresent) throw createError.NotFound("User not registered.");
    const verifyPassword = await isUserPresent.isPasswordValid(password);

    if (!verifyPassword) throw createError.Unauthorized("Invalid credentials.");
    // Generate jwt token
    const access_token = jwt.sign(
      { userId: isUserPresent._id, email },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "1m" }
    );
    const refresh_token = jwt.sign(
      { userId: isUserPresent._id, email },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "3m" }
    );

    res.cookie("access_token", access_token, {
      maxAge: 1000 * 60 * 3, // ms * sec * min
    });
    res.cookie("refresh_token", refresh_token, {
      maxAge: 1000 * 60 * 6, // ms * sec * min
    });

    res.status(200).send({ message: "Login success." });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/logout", async (req, res, next) => {
  try {
    // check if token is blacklisted : logic here
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
    if (!refreshToken) throw createError.BadRequest();
    const isTokenValid = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
    if (!isTokenValid) throw createError.Unauthorized("Please login again.");
    const { userId, email, ...rest } = isTokenValid; // userId and email from refreshToken payload
    const newAccessToken = jwt.sign(
      { userId, email },
      process.env.JWT_ACCESS_KEY,
      { expiresIn: "1m" }
    );
    res.cookie("access_token", newAccessToken, {
      maxAge: 1000 * 60 * 3, // ms * sec * min
    });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = { authRouter };
