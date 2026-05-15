const express = require("express");
const webhookController = require("./webhook.controller");

const router = express.Router();

router.post("/squad", webhookController.receiveSquadWebhook);

module.exports = router;
