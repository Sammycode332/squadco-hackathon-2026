const express = require("express");
const protect = require("../../middleware/auth.middleware");
const dashboardController = require("./dashboard.controller");

const router = express.Router();

router.use(protect);
router.get("/", dashboardController.overview);
router.get("/overview", dashboardController.overview);

module.exports = router;
