const authService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  return success(res, "Account created", data, 201);
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return success(res, "Login successful", data);
});

module.exports = { register, login };
