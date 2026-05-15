const store = require("../../utils/store");
const profileService = require("../profiles/profile.service");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getPaymentsForProfile = (profileId) => {
  return store.payments.filter((payment) => payment.profileId === profileId);
};

const calculateScore = (profileId) => {
  const profile = profileService.getProfile(profileId);
  const payments = getPaymentsForProfile(profileId);
  const totalPaymentValue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paymentFrequency = payments.length;
  const incomeScore = clamp(profile.monthlyIncome / 10000, 0, 25);
  const skillScore = clamp(profile.skills.length * 6, 0, 20);
  const transactionScore = clamp(paymentFrequency * 7 + totalPaymentValue / 50000, 0, 30);
  const trustScore = clamp(Object.keys(profile.trustSignals || {}).length * 5, 0, 15);
  const channelScore = profile.channel === "agent" ? 10 : 6;
  const score = Math.round(incomeScore + skillScore + transactionScore + trustScore + channelScore);
  const band = score >= 75 ? "growth_ready" : score >= 50 ? "credit_observable" : "needs_more_data";
  const suggestedLimit = band === "growth_ready" ? profile.monthlyIncome * 0.45 : band === "credit_observable" ? profile.monthlyIncome * 0.2 : 0;

  const result = {
    id: `score_${Date.now()}`,
    profileId,
    score,
    band,
    suggestedLimit: Math.round(suggestedLimit),
    signals: {
      incomeScore: Math.round(incomeScore),
      skillScore,
      transactionScore: Math.round(transactionScore),
      trustScore,
      channelScore,
      paymentFrequency,
      totalPaymentValue,
    },
    generatedAt: new Date().toISOString(),
  };

  store.scores.push(result);
  return result;
};

module.exports = { calculateScore };
