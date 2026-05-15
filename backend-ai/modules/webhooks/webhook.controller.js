const paymentService = require("../payments/payment.service");
const store = require("../../utils/store");
const asyncHandler = require("../../utils/asyncHandler");
const { success } = require("../../utils/response");

const receiveSquadWebhook = asyncHandler(async (req, res) => {
  const event = {
    id: `wh_${Date.now()}`,
    provider: "squad",
    payload: req.body,
    receivedAt: new Date().toISOString(),
  };

  store.webhooks.push(event);

  const data = req.body.data || req.body;
  const payment = paymentService.recordPayment({
    profileId: data.customer_identifier || data.customer?.customer_identifier,
    amount: data.amount || data.principal_amount,
    channel: "squad_webhook",
    status: data.transaction_status || data.status || "success",
    transaction_ref: data.transaction_ref || data.reference,
    ...data,
  });

  return success(res, "Squad webhook processed", { event, payment });
});

module.exports = { receiveSquadWebhook };
