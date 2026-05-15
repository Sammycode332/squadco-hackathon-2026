const store = {
  users: [],
  profiles: [],
  payments: [],
  webhooks: [],
  scores: [],
  opportunities: [
    {
      id: "opp_market_001",
      title: "Supply vegetables to Lekki restaurant cluster",
      type: "trade",
      location: "Lagos",
      skills: ["sales", "vegetables", "food"],
      language: ["english", "yoruba", "hausa"],
      value: 180000,
    },
    {
      id: "opp_job_001",
      title: "Solar installation apprenticeship",
      type: "job",
      location: "Kano",
      skills: ["electrical", "solar", "installation"],
      language: ["english", "hausa"],
      value: 90000,
    },
    {
      id: "opp_finance_001",
      title: "Trader inventory microcredit",
      type: "finance",
      location: "National",
      skills: ["trader", "retail", "inventory"],
      language: ["english", "yoruba", "hausa", "igbo"],
      value: 120000,
    },
  ],
};

module.exports = store;
