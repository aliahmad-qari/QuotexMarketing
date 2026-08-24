# Candle Probability Lab

A professional monorepo for a quantitative market-analysis and research platform.

## Architecture

- `client`: Next.js App Router, React, TypeScript, Tailwind CSS, TradingView Lightweight Charts, Recharts, deployable to Vercel.
- `server`: Node.js, Express, TypeScript, Mongoose, MongoDB Atlas, REST API, `ws` WebSocket server, deployable to Render.
- Market data uses official Binance Spot REST and WebSocket endpoints.
- Predictions are deterministic indicator-agreement outputs for research and education only.

## Routes

Implemented frontend routes:

- `/`
- `/dashboard`
- `/performance`
- `/methodology`
- `/risk-disclosure`
- `/about`

Reserved for the next authentication phase:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/account`
- `/admin`

No temporary authentication, fake users, localStorage login, fake admin roles, demo trading, order execution, Quotex scraping, or unofficial Quotex APIs are implemented.

## Environment

Frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
```

Backend:

```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=
FRONTEND_URL=http://localhost:3001
BINANCE_REST_URL=https://api.binance.com
BINANCE_WS_URL=wss://stream.binance.com:9443
PREDICTION_MODEL_VERSION=indicator-v1
```

## Development

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run client:dev`
- `npm run server:dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

## Risk Notice

Candle Probability Lab is not a broker, does not execute trades, does not hold funds, and does not provide financial advice. All predictions are bounded mathematical research outputs and can be wrong.
