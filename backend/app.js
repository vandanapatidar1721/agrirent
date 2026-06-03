const express = require("express");
const cors = require("cors");
const { config } = require("./config/env");
const apiLogger = require("./middleware/apiLogger");
const routes = require("./routes");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (Postman, server-to-server) with no Origin header
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(apiLogger);
app.use(routes);

module.exports = app;
