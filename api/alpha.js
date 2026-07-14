const crypto = require("crypto");

const BASE_URL = "https://web3.binance.com/build";
const BUILD_PREFIX = "/build";

const routes = {
  chains: { method: "GET", path: "/api/v1/dex/market/supported/chain" },
  hot: { method: "GET", path: "/api/v1/dex/market/token/hot-token" },
  search: { method: "GET", path: "/api/v1/dex/market/token/search" },
  candles: { method: "GET", path: "/api/v1/dex/market/candles" },
  holders: { method: "GET", path: "/api/v1/dex/market/token/holder" },
  topTraders: { method: "GET", path: "/api/v1/dex/market/token/top-trader" },
  basicInfo: { method: "POST", path: "/api/v1/dex/market/token/basic-info" },
  advancedInfo: { method: "GET", path: "/api/v1/dex/market/token/advanced-info" },
  priceInfo: { method: "POST", path: "/api/v1/dex/market/price-info" }
};

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const apiKey = process.env.BINANCE_WEB3_API_KEY;
  const secretKey = process.env.BINANCE_WEB3_SECRET_KEY;
  if (!apiKey || !secretKey) {
    sendJson(res, 503, {
      ok: false,
      error: "BINANCE_WEB3_API_KEY 和 BINANCE_WEB3_SECRET_KEY 尚未配置",
      source: "chianpulse-proxy"
    });
    return;
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
    const action = url.searchParams.get("action") || "search";
    const route = routes[action];
    if (!route) {
      sendJson(res, 400, { ok: false, error: `不支持的 Alpha API action: ${action}` });
      return;
    }

    const params = Object.fromEntries(url.searchParams.entries());
    delete params.action;

    const body = route.method === "GET" ? "" : JSON.stringify(await readJsonBody(req, params));
    const query = route.method === "GET" ? encodeQuery(params) : "";
    const fullPath = query ? `${route.path}?${query}` : route.path;
    const requestPath = `${BUILD_PREFIX}${fullPath}`;
    const timestamp = new Date().toISOString();
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(timestamp + route.method + requestPath + body, "utf8")
      .digest("base64");

    const upstream = await fetch(`${BASE_URL}${fullPath}`, {
      method: route.method,
      headers: {
        "Content-Type": "application/json",
        "X-OC-APIKEY": apiKey,
        "X-OC-TIMESTAMP": timestamp,
        "X-OC-SIGN": signature,
        "X-OC-RECV-WINDOW": "60000"
      },
      body: route.method === "GET" ? undefined : body
    });

    const text = await upstream.text();
    const payload = parseJson(text);
    sendJson(res, upstream.status, {
      ok: upstream.ok,
      action,
      source: "binance-web3-market",
      data: payload ?? text
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message || "Alpha proxy request failed",
      source: "chianpulse-proxy"
    });
  }
};

function encodeQuery(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

function readJsonBody(req, fallback) {
  return new Promise(resolve => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw) {
        resolve(fallback);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(fallback);
      }
    });
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.CHIANPULSE_ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
