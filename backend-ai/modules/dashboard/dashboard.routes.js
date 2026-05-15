const express = require("express");
const protect = require("../../middleware/auth.middleware");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

router.use(protect);
router.get("/overview", dashboardController.overview);

module.exports = router;
