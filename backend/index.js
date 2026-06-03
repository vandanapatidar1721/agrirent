const dotenv = require("dotenv");

dotenv.config();

const { config, validateEnv } = require("./config/env");
const app = require("./app");
const connectDatabase = require("./config/database");
const seedProductsIfEmpty = require("./config/seed");

validateEnv();

connectDatabase()
  .then(async () => {
    if (config.enableSeed) {
      await seedProductsIfEmpty();
    } else {
      console.log("Demo seed disabled (ENABLE_SEED=false)");
    }
  })
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} (${config.nodeEnv})`);
      console.log(
        `API logging: ${config.enableApiLogging ? "ON" : "OFF"} (ENABLE_API_LOGGING)`
      );
    });
  })
  .catch((err) => console.error("Startup failed:", err.message));
