const userService = require("./user.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const listUsers = asyncHandler(async (req, res) => {
  return success(res, "Users retrieved", userService.listUsers());
});

module.exports = { listUsers };
