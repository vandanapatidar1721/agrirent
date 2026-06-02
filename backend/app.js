const express = require("express");
const cors = require("cors");
const apiLogger = require("./middleware/apiLogger");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(apiLogger);
app.use(routes);

module.exports = app;
