const store = require("../../utils/store");

const normalize = (value) => String(value || "").trim().toLowerCase();

const extractSignals = (payload) => {
  const text = normalize(`${payload.bio || ""} ${payload.trade || ""} ${payload.skills || ""}`);
  const inferredSkills = [];

  if (text.includes("tomato") || text.includes("vegetable")) inferredSkills.push("vegetables", "food", "sales");
  if (text.includes("tailor") || text.includes("fashion")) inferredSkills.push("tailoring", "fashion");
  if (text.includes("solar") || text.includes("electric")) inferredSkills.push("solar", "electrical");
  if (text.includes("phone") || text.includes("repair")) inferredSkills.push("phone repair", "electronics");

  return Array.from(new Set([...(payload.skills || []), ...inferredSkills].map(normalize).filter(Boolean)));
};

const createProfile = (payload, agentId) => {
  const skills = extractSignals(payload);
  const profile = {
    id: `eco_${Date.now()}`,
    agentId,
    fullName: payload.fullName,
    phone: payload.phone,
    type: payload.type,
    channel: payload.channel,
    language: normalize(payload.language || "english"),
    location: payload.location,
    trade: payload.trade || "",
    skills,
    monthlyIncome: Number(payload.monthlyIncome || 0),
    trustSignals: payload.trustSignals || {},
    createdAt: new Date().toISOString(),
  };

  store.profiles.push(profile);
  return profile;
};

const listProfiles = () => store.profiles;

const getProfile = (id) => {
  const profile = store.profiles.find((item) => item.id === id);

  if (!profile) {
    const error = new Error("Profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

const matchOpportunities = (profileId) => {
  const profile = getProfile(profileId);
  const profileLocation = normalize(profile.location);

  return store.opportunities
    .map((opportunity) => {
      const skillHits = opportunity.skills.filter((skill) => profile.skills.includes(skill)).length;
      const locationHit = normalize(opportunity.location) === profileLocation || normalize(opportunity.location) === "national";
      const languageHit = opportunity.language.includes(profile.language);
      const score = skillHits * 35 + (locationHit ? 20 : 0) + (languageHit ? 10 : 0);

      return { ...opportunity, matchScore: score };
    })
    .filter((opportunity) => opportunity.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};

module.exports = { createProfile, listProfiles, getProfile, matchOpportunities };
