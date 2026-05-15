const express = require("express");
const { z } = require("zod");
const validate = require("../../middleware/validate.middleware");
const authController = require("./auth.controller");

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    password: z.string().min(6),
    role: z.enum(["agent", "admin", "analyst"]).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    phone: z.string().min(7),
    password: z.string().min(6),
  }),
});

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

module.exports = router;
