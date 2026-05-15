const axios = require("axios");
const env = require("../../config/env");
const store = require("../../utils/store");
const profileService = require("../profiles/profile.service");

const squadClient = axios.create({
  baseURL: env.squadBaseUrl,
  headers: {
    Authorization: `Bearer ${env.squadSecretKey}`,
    "Content-Type": "application/json",
  },
});

const buildMockAccount = (profile) => ({
  account_number: String(Math.floor(2000000000 + Math.random() * 7000000000)),
  account_name: `SQUAD ${profile.fullName}`.slice(0, 60),
  bank_name: "GTBank",
  customer_identifier: profile.id,
});

const createVirtualAccount = async (profileId, payload) => {
  const profile = profileService.getProfile(profileId);

  if (env.squadMock || !env.squadSecretKey || !payload.bvn) {
    const account = buildMockAccount(profile);
    profile.virtualAccount = account;
    return { provider: "squad_mock", account };
  }

  const [firstName, ...rest] = profile.fullName.split(" ");
  const response = await squadClient.post("/virtual-account", {
    first_name: firstName,
    last_name: rest.join(" ") || firstName,
    mobile_num: profile.phone,
    dob: payload.dob,
    email: payload.email,
    bvn: payload.bvn,
    gender: payload.gender,
    address: payload.address || profile.location,
    customer_identifier: profile.id,
    beneficiary_account: payload.beneficiaryAccount,
  });

  profile.virtualAccount = response.data.data || response.data;
  return { provider: "squad", account: profile.virtualAccount };
};

const recordPayment = (payload) => {
  const payment = {
    id: payload.transaction_ref || payload.reference || `pay_${Date.now()}`,
    profileId: payload.profileId || payload.customer_identifier,
    amount: Number(payload.amount || 0),
    channel: payload.channel || "squad_virtual_account",
    status: payload.status || "success",
    raw: payload,
    createdAt: new Date().toISOString(),
  };

  store.payments.push(payment);
  return payment;
};

const listPayments = () => store.payments;

module.exports = { createVirtualAccount, recordPayment, listPayments };
