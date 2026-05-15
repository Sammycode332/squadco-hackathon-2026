require("dotenv").config();

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  squadBaseUrl: process.env.SQUAD_BASE_URL || "https://sandbox-api-d.squadco.com",
  squadSecretKey: process.env.SQUAD_SECRET_KEY || "",
  squadMock: process.env.SQUAD_MOCK !== "false",
};

module.exports = env;
