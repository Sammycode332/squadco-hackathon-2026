const { fail } = require("../utils/response");

const notFound = (req, res) => {
  return fail(res, `Route ${req.originalUrl} not found`, 404);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error";

  return fail(res, message, statusCode, {
    path: req.originalUrl,
  });
};

module.exports = { notFound, errorHandler };
