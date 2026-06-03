/**
 * Central env helpers — load dotenv once in index.js before requiring this.
 */

function envFlag(name, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return defaultValue;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

function envList(name, defaultList = []) {
  const value = process.env[name];
  if (!value || !String(value).trim()) return defaultList;
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigins: envList("CORS_ORIGIN", [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]),
  enableApiLogging: envFlag("ENABLE_API_LOGGING", false),
  enableSeed: envFlag("ENABLE_SEED", true),
  isProduction: (process.env.NODE_ENV || "development") === "production",
};

function validateEnv() {
  const errors = [];

  if (!config.mongoUri) {
    errors.push("MONGO_URI is required in .env");
  }

  if (!config.jwtSecret) {
    errors.push("JWT_SECRET is required in .env");
  } else if (
    config.jwtSecret.length < 32 ||
    config.jwtSecret === "change-me-to-a-long-random-secret" ||
    config.jwtSecret === "agriRentSecretKey"
  ) {
    if (config.isProduction) {
      errors.push("JWT_SECRET must be a strong random string in production");
    } else {
      console.warn(
        "[env] Use a long random JWT_SECRET before going live (e.g. openssl rand -base64 32)"
      );
    }
  }

  if (config.isProduction && config.enableApiLogging) {
    console.warn(
      "[env] ENABLE_API_LOGGING=true in production — consider false to reduce noise and avoid logging sensitive data"
    );
  }

  if (errors.length) {
    throw new Error(`Environment configuration error:\n- ${errors.join("\n- ")}`);
  }
}

module.exports = { config, envFlag, envList, validateEnv };
