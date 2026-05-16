const express = require("express");
const { z } = require("zod");
const protect = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const paymentController = require("./payment.controller");

const router = express.Router();

const virtualAccountSchema = z.object({
  body: z.object({
    dob: z.string().optional(),
    email: z.string().email().optional(),
    bvn: z.string().optional(),
    gender: z.enum(["1", "2"]).optional(),
    address: z.string().optional(),
    beneficiaryAccount: z.string().optional(),
  }),
  params: z.object({
    profileId: z.string().min(1),
  }),
});

const paymentSchema = z.object({
  body: z.object({
    profileId: z.string().min(1),
    amount: z.coerce.number().positive(),
    channel: z.string().optional(),
    status: z.string().optional(),
    reference: z.string().optional(),
    transaction_ref: z.string().optional(),
  }),
});

router.use(protect);
router.post("/virtual-accounts/:profileId", validate(virtualAccountSchema), paymentController.createVirtualAccount);
router.post("/simulate", validate(paymentSchema), paymentController.recordPayment);
router.get("/", paymentController.listPayments);

module.exports = router;
