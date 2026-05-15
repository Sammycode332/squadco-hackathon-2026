const express = require("express");
const cors = require("cors");
const authRoutes = require("../modules/auth/auth.routes");
const profileRoutes = require("../modules/profiles/profile.routes");
const scoreRoutes = require("../modules/scores/score.routes");
const paymentRoutes = require("../modules/payments/payment.routes");
const webhookRoutes = require("../modules/webhooks/webhook.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const userRoutes = require("../modules/users/user.routes");
const { notFound, errorHandler } = require("../middleware/error.middleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Economic intelligence API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
