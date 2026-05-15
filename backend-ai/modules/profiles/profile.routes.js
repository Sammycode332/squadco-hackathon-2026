const express = require("express");
const { z } = require("zod");
const protect = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const profileController = require("./profile.controller");

const router = express.Router();

const profileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    type: z.enum(["trader", "job_seeker", "worker"]),
    channel: z.enum(["whatsapp", "ussd", "agent", "web"]),
    language: z.string().optional(),
    location: z.string().min(2),
    trade: z.string().optional(),
    skills: z.array(z.string()).optional(),
    bio: z.string().optional(),
    monthlyIncome: z.number().nonnegative().optional(),
    trustSignals: z.record(z.string(), z.any()).optional(),
  }),
});

router.use(protect);
router.post("/", validate(profileSchema), profileController.createProfile);
router.get("/", profileController.listProfiles);
router.get("/:id", profileController.getProfile);
router.get("/:id/opportunities", profileController.matchOpportunities);

module.exports = router;
