const express = require("express");
const protect = require("../../middleware/auth.middleware");
const userController = require("./user.controller");

const router = express.Router();

router.use(protect);
router.get("/", userController.listUsers);

module.exports = router;
