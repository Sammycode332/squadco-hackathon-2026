const profileService = require("./profile.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const createProfile = asyncHandler(async (req, res) => {
  const profile = profileService.createProfile(req.body, req.user.id);
  return success(res, "Economic profile created", profile, 201);
});

const listProfiles = asyncHandler(async (req, res) => {
  return success(res, "Profiles retrieved", profileService.listProfiles());
});

const getProfile = asyncHandler(async (req, res) => {
  return success(res, "Profile retrieved", profileService.getProfile(req.params.id));
});

const matchOpportunities = asyncHandler(async (req, res) => {
  return success(res, "Opportunity matches generated", profileService.matchOpportunities(req.params.id));
});

module.exports = { createProfile, listProfiles, getProfile, matchOpportunities };
