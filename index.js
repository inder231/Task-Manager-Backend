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
const axios = require("axios");

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

const CLIENT_ID = "299d269ce9ecca814fc0";
const CLIENT_SECRET = "45d41ca76545d475a01a848242f3215b61b42146";

const isProduction = process.env.NODE_ENV === "production";

// Home route
app.get("/", (req, res) => {
  res.status(200).send({ message: "Task manager" });
});

// GOOGLE OAUTH
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
    // const access_token = jwt.sign({ ...req.user }, process.env.JWT_ACCESS_KEY, {
    //   expiresIn: "1m",
    // });
    const access_token = req.user.accessToken;
    // console.log("LINE 59",req.user.accessToken);
    res.cookie("access_token", access_token, {
      maxAge: 1000 * 60 * 3, // ms * sec * min
      httpOnly: true,
      sameSite: "strict",
      signed: true,
    });
    res.redirect("/");
  }
);

// GITHUB OAUTH
app.get("/auth/github", async (req, res, next) => {
  const { code } = req.query;
  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }
    );
    // console.log(response.data,"response");
    const access_token = response.data.split("=")[1].split("&")[0];

    // Getting user data;
    const { data } = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    res.json(data);
  } catch (error) {
    next(error);
  }
});
app.get("/protected", async (req, res) => {
  const isAccessTokenValid = await axios.get(
    "https://www.googleapis.com/oauth2/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${req.signedCookies.access_token}`,
      },
    }
  );
  if (isAccessTokenValid) {
    res.send("Protected");
  } else {
    res.send(isAccessTokenValid);
  }
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
