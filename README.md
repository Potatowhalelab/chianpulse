# ChianPulse

ChianPulse is a browser dashboard for on-chain intelligence, wallet monitoring, Alpha project tracking, and mobile alert forwarding.

## Binance Web3 Alpha Proxy

The static frontend must not store Binance Web3 API secrets. The backend proxy in `api/alpha.js` signs Binance Web3 Market API requests on the server and exposes a safe frontend endpoint:

```txt
GET /api/alpha?action=search&keyword=ASTER
GET /api/alpha?action=hot&limit=30
GET /api/alpha?action=candles&chainId=...&tokenAddress=...
GET /api/alpha?action=holders&chainId=...&tokenAddress=...
GET /api/alpha?action=topTraders&chainId=...&tokenAddress=...
```

Required environment variables:

```txt
BINANCE_WEB3_API_KEY=your_api_key
BINANCE_WEB3_SECRET_KEY=your_secret_key
CHIANPULSE_ALLOWED_ORIGIN=https://potatowhalelab.github.io
```

For GitHub Pages plus a separate API host, add this before `script.js` in `index.html` after deploying the API:

```html
<script>
  window.CHIANPULSE_API_BASE = "https://your-chianpulse-api.vercel.app";
</script>
```

Without a deployed proxy or API keys, the Alpha page still falls back to the local candidate library, Binance public spot market data, and DexScreener contract lookup.

## Local Checks

```bash
npm run check
```
