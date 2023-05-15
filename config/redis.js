const Redis = require("ioredis");
require("dotenv").config();

const redis = new Redis({
    port: 10133,
    host: "redis-10133.c301.ap-south-1-1.ec2.cloud.redislabs.com",
    password: process.env.REDIS_LABS_PASSWORD,
    username: "default",
  });

module.exports = {redis};