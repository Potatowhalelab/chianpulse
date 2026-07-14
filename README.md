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

For GitHub Pages plus a separate API host, update `config.js` after deploying the API:

```js
window.CHIANPULSE_API_BASE = "https://your-chianpulse-api.vercel.app";
```

Without a deployed proxy or API keys, the Alpha page still falls back to the local candidate library, Binance public spot market data, and DexScreener contract lookup.

## Deploy The Proxy

Recommended path:

1. Open Vercel and import `https://github.com/Potatowhalelab/chianpulse`.
2. Keep the root directory as the repository root.
3. Add the three environment variables from `.env.example`.
4. Deploy.
5. Copy the deployed domain into `config.js` if GitHub Pages remains the public frontend.

If the whole site is served from Vercel, `config.js` can stay empty because `/api/alpha` is same-origin.

## Local Checks

```bash
npm run check
```
