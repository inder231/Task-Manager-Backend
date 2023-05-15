const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const { app } = require("../index");
const { User } = require("../models/user.model");

chai.use(chaiHttp);

// Home route test
describe("Home route", () => {
  it("should check if the application is running or not", (done) => {
    chai
      .request(app)
      .get("/")
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property("message").eql("Task manager");
        done();
      });
  });
});

// Register/Login route test
describe("Register - Login - Logout", () => {
  after("Delete created user", function () {
    // runs after each test in this block
    return User.findOneAndDelete({ email: "jhondoe@gmail.com" })
      .then(() => {
        // console.log("Deleted test account successfully");
      })
      .catch((err) => {
        // error handling
        console.warn("collection may not exist!", err);
      });
  });
  let access_token, refresh_token;
  it("should register the user to data base with hashed password", (done) => {
    chai
      .request(app)
      .post("/auth/register")
      .send({
        name: "John Doe",
        email: "jhondoe@gmail.com",
        password: "jhon_doe_password",
      })
      .end((err, res) => {
        if (err) {
          console.error(err);
          done(err);
        } else {
          res.should.have.status(201);
          res.body.should.have.property("message").eql("Registered.");
          res.body.should.have.property("user").that.is.an("object");
          done();
        }
      });
  });
  it("should login user and generate jwt token, store in cookies", (done) => {
    chai
      .request(app)
      .post("/auth/login")
      .send({ email: "jhondoe@gmail.com", password: "jhon_doe_password" })
      .end((err, res) => {
        if (err) {
          console.error(err);
          done(err);
        } else {
          res.should.have.status(200);
          res.body.should.have.property("message").eql("Login success.");
          res.should.have.cookie("access_token").not.undefined;
          res.should.have.cookie("refresh_token").not.undefined;
          access_token = res.headers["set-cookie"][0]
            .split("=")[1]
            .split(";")[0];
          refresh_token = res.headers["set-cookie"][1]
            .split("=")[1]
            .split(";")[0];
          done();
        }
      });
  });
  it("should check if access token is generate using refresh token", (done) => {
    chai
      .request(app)
      .get("/auth/refresh-token")
      .set(
        "Cookie",
        `access_token=${access_token}; refresh_token=${refresh_token}`
      )
      .end((err, res) => {
        res.should.have.status(204);
        done();
      });
  });
  it("should check that access token is not generate if token is not in cookies", (done) => {
    chai
      .request(app)
      .get("/auth/refresh-token")
      .end((err, res) => {
        // res.should.have.status(400);
        res.should.have.status(401) // || res.should.have.status(400);  ( or does not work here);
        done();
      });
  });
  it("should logout user", (done) => {
    chai
      .request(app)
      .get("/auth/logout")
      .set(
        "Cookie",
        `access_token=${access_token}; refresh_token=${refresh_token}`
      )
      .end((err, res) => {
        if (err) {
          done(err);
        } else {
          res.should.have.status(204);
          res.headers["set-cookie"].should.be
            .an("array")
            .that.does.not.include(["access_token", "refresh_token"]);
          done();
        }
      });
  });
});
