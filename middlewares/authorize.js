const createError = require("http-errors");

module.exports = {
  authorize: (permittedRoles) => async (req, res, next) => {
    try {
      const userRole = req.role;

      if (permittedRoles?.includes(userRole)) {
        next();
      } else {
        throw createError.Unauthorized("Not authorized to perform the action.");
      }
    } catch (error) {
      next(error);
    }
  },
};
