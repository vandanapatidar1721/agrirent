const { config } = require("../config/env");

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "jwt",
  "secret",
]);

function redact(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = "[redacted]";
    } else if (value && typeof value === "object") {
      out[key] = redact(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function apiLogger(req, res, next) {
  if (!config.enableApiLogging) {
    return next();
  }

  const start = Date.now();
  const { method, url, body, query, params } = req;
  const originalJson = res.json.bind(res);

  res.json = (data) => {
    const duration = Date.now() - start;
    try {
      console.log("\n=== API CALL ===");
      console.log("Method:", method);
      console.log("URL:", url);
      if (Object.keys(params || {}).length) console.log("Params:", params);
      if (Object.keys(query || {}).length) console.log("Query:", query);
      if (Object.keys(body || {}).length) console.log("Body:", redact(body));
      console.log("Status:", res.statusCode);
      console.log("Response:", redact(data));
      console.log("Duration:", `${duration}ms`);
      console.log("================\n");
    } catch (_) {
      // ignore logging errors
    }
    return originalJson(data);
  };

  next();
}

module.exports = apiLogger;
