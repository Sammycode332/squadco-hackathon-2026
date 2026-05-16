const express = require("express");
const protect = require("../../middleware/auth.middleware");
const scoreController = require("./score.controller");

const router = express.Router();

router.use(protect);
router.get("/:profileId", scoreController.calculateScore);

module.exports = router;
