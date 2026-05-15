const dashboardService = require("./dashboard.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const overview = asyncHandler(async (req, res) => {
  return success(res, "Dashboard overview retrieved", dashboardService.overview());
});

module.exports = { overview };
