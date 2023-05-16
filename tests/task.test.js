const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const { app } = require("../index");
const { Task } = require("../models/task.model");

chai.use(chaiHttp);

describe("Task routes", () => {
    it("should get all the tasks",(done)=>{
        chai.request(app)
        .get("/task/all")
        .end((err,res)=>{
            res.should.have.status(200);
            res.body.should.be.an("object");
            done();
        })
    })
//     let taskId;
//   after("Deleting task",async() => {
//     console.log(taskId);
//     return await Task.findByIdAndDelete(taskId);
//   });
//   it("should return a specific task", async (done) => {
//     const newTask = new Task({
//       title: "Test task",
//       description: "Test task description",
//       dueDate: "2023-05-20",
//       assignedTo: "test@gmail.com",
//       project: "Task manager",
//     });
//     await newTask.save();
//     taskId = newTask._id;
//     chai
//       .request(app)
//       .get(`/task/${newTask._id}`)
//       .end((err, res) => {
//         res.should.have.status(200);
//         res.body.should.be.a("object");
//         done();
//       });
//   });
});
