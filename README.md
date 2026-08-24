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

Authentication and account routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/account`
- `/admin`

No temporary authentication, fake users, localStorage login, fake admin roles, demo trading, order execution, Quotex scraping, or unofficial Quotex APIs are implemented.

## Authentication

The Express backend is the source of truth for users, password verification, refresh sessions, roles, password resets, account status, and admin authorization.

- Roles: `user`, `researcher`, `admin`
- Default registration role: `user`
- Password hashing: Argon2id
- Access token: short-lived bearer token kept in frontend memory only
- Refresh token: opaque rotating token stored as a hashed value server-side and delivered through a Secure, HttpOnly cookie
- CSRF: double-submit token for cookie-backed unsafe requests
- Admin changes are audited in `AuditLog`

Production deployments should use sibling subdomains such as:

- `app.example.com` for the Vercel frontend
- `api.example.com` for the Render backend

Keeping the app and API under the same parent domain improves secure cookie reliability while still allowing exact CORS allowlisting.

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
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30
COOKIE_DOMAIN=
EMAIL_PROVIDER=
EMAIL_FROM=
EMAIL_API_KEY=
ADMIN_BOOTSTRAP_EMAIL=
```

Create the first administrator with:

```bash
npm run create-admin -w server -- --email=admin@example.com
```

Set `ADMIN_BOOTSTRAP_EMAIL` to constrain which email can be bootstrapped.

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
