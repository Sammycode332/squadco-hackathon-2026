const jwt = require("jsonwebtoken");
const env = require("../config/env");
const store = require("../utils/store");
const { fail } = require("../utils/response");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return fail(res, "Authentication token is required", 401);
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = store.users.find((item) => item.id === decoded.id);

    if (!user) {
      return fail(res, "User no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return fail(res, "Invalid or expired token", 401);
  }
};

module.exports = protect;


