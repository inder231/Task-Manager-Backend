const createError = require("http-errors");
const { Task } = require("../models/task.model");
const authorize = require("../middlewares/authorize");
const taskRouter = require("express").Router();

taskRouter.get("/all", async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).send({ tasks });
  } catch (error) {
    next(error);
  }
});
taskRouter.get("/:taskId", async (req, res, next) => {
  try {
    const task = await Task.findById({ _id: req.params.taskId });
    res.status(200).send({ task });
  } catch (error) {
    next(error);
  }
});
taskRouter.post("/", async (req, res, next) => {
  try {
    const userId = req.userId;
    const tasks = new Task({ ...req.body,createdBy:userId });
    const task = await tasks.save();
    res.status(200).send({ task });
  } catch (error) {
    next(error);
  }
});
taskRouter.patch("/:taskId", async (req, res, next) => {
  try {
    const update = req.body;
    const id = req.params.taskId;
    const task = await Task.findByIdAndUpdate(id,update);
    res.status(200).send({ task });
  } catch (error) {
    next(error);
  }
});
taskRouter.delete("/:taskId", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete({ _id: req.params.taskId });
    res.status(200).send({ task });
  } catch (error) {
    next(error);
  }
});

module.exports = { taskRouter };
