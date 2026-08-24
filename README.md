# Candle Probability Lab

A complete, production-grade quantitative market-analysis and research platform.

**Candle Probability Lab** visualizes real live Binance Spot market candles followed by two clearly labelled, deterministic probability-based predicted candles:
1. **Actual market candles** (live Binance stream with sub-minute to multi-hour intervals)
2. **PREDICTED Candle +1** (immediate horizon direction and 50%–80% bounded confidence)
3. **PREDICTED Candle +2** (compound horizon direction with variance decay and 50%–75% confidence)

---

## ⚠️ Important Research & Regulatory Notice

* **Not a Broker:** This application is strictly a market-analysis, quantitative research, and educational platform. It does not execute orders, take deposits, or provide automated trading.
* **No Black-Box Promises:** Predictions are calculated deterministically from 12 technical indicator metrics (EMA 9/21, RSI 14, MACD, ATR 14, Wick Pressure, Momentum, Volume Surge).
* **Zero Look-Ahead Bias:** Predictions are locked immutably at the millisecond a candle opens, and evaluated against the true close price once the target candle seals.

---

## 🛠️ Architecture & Tech Stack

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, TradingView Lightweight Charts, Lucide Icons.
* **Backend:** Node.js, Express, WebSocket (`ws`), Mongoose / MongoDB Atlas (with in-memory fallback), Helmet, CORS, Rate Limiting.
* **Data Pipelines:** Official Binance Spot REST (`api.binance.com`) + Live WebSocket multiplex streams.
* **Indicators:** EMA 9/21, RSI 14, MACD (12, 26, 9), ATR 14, Candle Body Pressure, Upper/Lower Wick Absorption, Momentum (5), Volume Change, Trend Strength.

---

## 🚀 Getting Started

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/candle_lab
CORS_ORIGIN=*
```

*(Note: If `MONGODB_URI` is not provided, the server automatically defaults to high-speed in-memory state repository for seamless offline or demo execution).*

### 2. Install & Run

```bash
# Install dependencies
npm install

# Start development server (Node Express + Vite + WebSocket)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## 📊 Supported Markets & Timeframes

* **Spot Pairs:** `BTCUSDT`, `ETHUSDT`, `BNBUSDT`, `SOLUSDT`, `XRPUSDT`, `ADAUSDT`, `DOGEUSDT`
* **Intervals:** `5s`, `10s`, `15s`, `30s` (aggregated), `1m`, `2m` (aggregated), `5m`, `1h`, `2h`, `3h` (aggregated)

---

## 📜 Deployment

* **Render:** Use the included `render.yaml` blueprint for one-click deployment.
* **Vercel / Cloud Run:** Use standard Node container or static build via `vercel.json`.
