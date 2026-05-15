const store = require("../../utils/store");

const overview = () => {
  const profiles = store.profiles;
  const payments = store.payments;
  const totalPaymentValue = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const byLocation = profiles.reduce((map, profile) => {
    map[profile.location] = (map[profile.location] || 0) + 1;
    return map;
  }, {});
  const byType = profiles.reduce((map, profile) => {
    map[profile.type] = (map[profile.type] || 0) + 1;
    return map;
  }, {});
  const latestScores = store.scores.slice(-10).reverse();
  const creditReady = latestScores.filter((score) => score.band === "growth_ready").length;

  return {
    usersOnboarded: profiles.length,
    paymentVolume: totalPaymentValue,
    paymentCount: payments.length,
    creditReady,
    byLocation,
    byType,
    latestScores,
    economicSignals: {
      informalActivityCaptured: profiles.length * 3 + payments.length,
      estimatedJobsMatched: Math.round(profiles.length * 0.42),
      estimatedCreditUnlocked: latestScores.reduce((sum, score) => sum + score.suggestedLimit, 0),
    },
  };
};

module.exports = { overview };
