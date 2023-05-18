const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { authRouter } = require("./routes/auth.routes");
const { connection } = require("./config/db");
require("./oauth/google");
const createError = require("http-errors");
const { taskRouter } = require("./routes/task.routes");
const { auth } = require("./middlewares/auth");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const session = require("express-session");

require("dotenv").config();

// Initializing express application
const app = express();

const port = process.env.PORT || 8080;

app.use(cookieParser(process.env.COOKIE_PARSER_SECRET));
app.use(express.json()); // body parser
app.use(express.urlencoded({ extended: true })); //  parses data passed in urlencoded form
app.use(express.static("public"));
app.use(
  cors({
    origin: "*",
  })
);


const isProduction = process.env.NODE_ENV === "production";

// Home route
app.get("/", (req, res) => {
  res.status(200).send({ message: "Task manager" });
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google",
    session: false,
  }),
  function (req, res) {
    // Generate jwt token and store in cookies
    const access_token = jwt.sign({ ...req.user }, process.env.JWT_ACCESS_KEY, {
      expiresIn: "1m",
    });
    res.cookie("access_token", access_token, {
      maxAge: 1000 * 60 * 3, // ms * sec * min
      httpOnly: true,
      sameSite: "strict",
      signed: true,
    });
    res.redirect("/");
  }
);

app.get("/protected", auth, (req, res) => {
  res.send("Protected");
});
app.use("/auth", authRouter);
app.use("/task", taskRouter);

// Handling the route which is not created.
app.use((req, res, next) => {
  next(createError.NotFound());
});

// Error handler.
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

app.listen(port, async () => {
  try {
    await connection;
    console.log(`Listening on http://localhost:${port}`);
  } catch (error) {
    console.log(`Error connecting: ${error.message}`);
  }
});

module.exports = { app };
