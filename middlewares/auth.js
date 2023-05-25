const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const { redis } = require("../config/redis");

module.exports = {
  auth: async (req, res, next) => {
    try {
      // console.log(req.cookies);
      // console.log(req.signedCookies,"signed cookies");
      const access_token = req?.cookies?.access_token || req?.signedCookies?.access_token
      
      if (!access_token) throw createError.Unauthorized();

      const isTokenBlacklisted = await redis.get(access_token);
      if (isTokenBlacklisted) throw createError.Unauthorized("Blacklisted");

      const isTokenValid = jwt.verify(access_token, process.env.JWT_ACCESS_KEY);
      if (!isTokenValid) throw createError.Unauthorized();
      
      req.userId = isTokenValid.userId;
      req.email = isTokenValid.email;
      next();
    } catch (error) {
      next(error);
    }
  },
};
