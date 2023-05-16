const mongoose = require("mongoose");

const TaskSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    createdBy: { type: "String", required: true },
    assignedTo: { type: "String", required: true },
    project: { type: "String", required: true },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", TaskSchema);
module.exports = { Task };
