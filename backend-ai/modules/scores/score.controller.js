const scoreService = require("./score.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const calculateScore = asyncHandler(async (req, res) => {
  return success(res, "Economic score generated", scoreService.calculateScore(req.params.profileId));
});

module.exports = { calculateScore };
