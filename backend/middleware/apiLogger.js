function apiLogger(req, res, next) {
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
      if (Object.keys(body || {}).length) console.log("Body:", body);
      console.log("Status:", res.statusCode);
      console.log("Response:", data);
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
