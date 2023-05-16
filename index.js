const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { authRouter } = require("./routes/auth.routes");
const { connection } = require("./config/db");

const createError = require("http-errors");
const { taskRouter } = require("./routes/task.routes");
const {auth} = require("./middlewares/auth");

require("dotenv").config();

// Initializing express application
const app = express();

const port = process.env.PORT || 8080;

app.use(cookieParser());
app.use(express.json()); // body parser
app.use(express.urlencoded({ extended: true })); //  parses data passed in urlencoded form
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
