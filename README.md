# KINESIS Unified Platform

AI-Powered Prediction Exchange & Autonomous Trading Ecosystem.

This repo contains two projects:
- `server/` — Flask + SQLAlchemy + Socket.IO + Redis backend (Python)
- `client/` — React + Vite + TailwindCSS frontend

Both run in **test/demo mode** out of the box (no real money, Sepolia testnet wallets, mock AI responses if no API key is set).

---

## Quick Start (Docker — recommended)

Requirements: Docker + Docker Compose.

```bash
# 1. Configure backend env
cp server/.env.example server/.env
# edit server/.env: set SECRET_KEY, JWT_SECRET_KEY to random strings
#                    (OPENAI_API_KEY / RAZORPAY / ODDS_API_KEY are optional)

# 2. Configure frontend build vars (used at build time)
cp .env.example .env
# edit .env if your server isn't on localhost

# 3. Build and run everything
docker compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:5000/api
- Postgres: localhost:5432
- Redis: localhost:6379

Database tables are created automatically via `flask db upgrade` on container start.

---

## Manual / Local Development Setup

### Backend (server/)

Requirements: Python 3.12, PostgreSQL, Redis.

```bash
cd server
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env with your local Postgres credentials and a random SECRET_KEY / JWT_SECRET_KEY

# create the database (one time)
createdb kinesis      # or: psql -U postgres -c "CREATE DATABASE kinesis;"

# run migrations
flask db upgrade

# run the server
python run.py
```

The backend runs on `http://localhost:5000`.

### Frontend (client/)

Requirements: Node.js 18+.

```bash
cd client
npm install

cp .env.example .env
# edit .env if your backend isn't on http://127.0.0.1:5000

npm run dev      # development server on http://localhost:5173
# or
npm run build && npm run preview   # production build
```

---

## Environment Variables

### server/.env
| Variable | Description |
|---|---|
| `SECRET_KEY` / `JWT_SECRET_KEY` | Random secrets — **must be changed** for production |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL connection |
| `REDIS_HOST`, `REDIS_PORT` | Redis connection |
| `OPENAI_API_KEY` | Optional. If unset, AGENTEX AI features return mock/fallback responses |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Optional. Needed for real payment flows |
| `ODDS_API_KEY` | Optional. Needed to auto-seed real sports markets from The Odds API |
| `ADMIN_WALLET_ADDRESS` | Optional platform admin wallet address |

### client/.env
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default `http://127.0.0.1:5000/api`) |
| `VITE_SOCKET_URL` | Backend Socket.IO URL (default `http://127.0.0.1:5000`) |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect/RainbowKit project ID (get one free at cloud.reown.com) |

---

## Notes on Real-Money / Production Use

This platform currently runs in demo mode:
- Wallet flows use Sepolia testnet via RainbowKit/Wagmi (no real funds)
- "Wallet balance" shown in the UI is a virtual ledger balance stored in Postgres
- Razorpay integration is wired but requires real API keys to process payments
- AI features (AGENTEX, AI Builder) fall back to deterministic mock responses if `OPENAI_API_KEY` is not set
- Autonomous agents and arbitrage scanning run on simulated/cross-platform-simulated odds

Before going to production with real money:
1. Set strong, unique `SECRET_KEY` / `JWT_SECRET_KEY`
2. Add real `OPENAI_API_KEY`, `RAZORPAY_KEY_ID`/`SECRET`, `ODDS_API_KEY`
3. Put the backend behind HTTPS (e.g. via a reverse proxy / load balancer)
4. Review rate limiting and CORS settings (`app/__init__.py` currently allows all origins)
5. Replace the Sepolia testnet config in `client/src/providers/Web3Provider.jsx` with your target chain(s)

---

## Project Structure

```
server/
  app/
    auth/          - JWT login/register
    markets/       - market CRUD, live odds engine, odds seeder
    bets/          - bet placement, orderbook
    wallet/        - wallet, Razorpay payments
    portfolio/     - positions, P&L, performance
    ai/            - AGENTEX AI assistant
    ai_builder/    - NL2KCL natural-language market/agent generator
    agents/        - autonomous betting agents
    arbitrage/     - cross-platform arbitrage scanner
    intelligence/  - edge/sentiment analytics
    marketplace/   - agent marketplace
    admin/         - admin dashboard endpoints
    socket/        - Socket.IO real-time handlers
    models/        - SQLAlchemy models
  migrations/      - Alembic migrations
  run.py           - entrypoint

client/
  src/
    pages/         - route pages (Markets, Portfolio, Agents, Arbitrage, AI Builder, Admin, etc.)
    components/    - shared UI components
    store/         - Zustand state stores
    api/           - axios API clients per module
    providers/     - Web3 (RainbowKit/Wagmi) provider
    socket.js      - Socket.IO client
```
