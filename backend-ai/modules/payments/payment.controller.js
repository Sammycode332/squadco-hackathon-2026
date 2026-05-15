const paymentService = require("./payment.service");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const createVirtualAccount = asyncHandler(async (req, res) => {
  const data = await paymentService.createVirtualAccount(req.params.profileId, req.body);
  return success(res, "Squad virtual account ready", data, 201);
});

const recordPayment = asyncHandler(async (req, res) => {
  return success(res, "Payment recorded", paymentService.recordPayment(req.body), 201);
});

const listPayments = asyncHandler(async (req, res) => {
  return success(res, "Payments retrieved", paymentService.listPayments());
});

module.exports = { createVirtualAccount, recordPayment, listPayments };
