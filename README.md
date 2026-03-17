# Pablito 🧳

> **Pablito is checking your bags…**

Real-time multi-chain portfolio tracker powered by **Pyth Network** oracle price feeds. Connect your wallets and let Pablito do the checking.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Pyth Network](https://img.shields.io/badge/Pyth_Network-Live_Prices-6C3FC4)
![WalletConnect](https://img.shields.io/badge/WalletConnect-v2-3B99FC)
![License](https://img.shields.io/badge/License-MIT-green)

---

## What Pablito checks

- **30+ live Pyth oracle prices** — crypto, equities, FX, commodities, ETFs. Every 5 seconds via [Pyth Network Hermes](https://github.com/aditya520/pyth-mcp)
- **Your bags (wallets)** — MetaMask, Rabby, Coinbase Wallet, Rainbow, Trust, WalletConnect QR, and any EIP-6963 wallet via Web3Modal v3
- **Multiple chains** — Ethereum, Arbitrum, Optimism, Base, Polygon, BSC
- **Historical charts** — OHLC data from Pyth Benchmarks (1H → 1Y)
- **Market vibes** — Fear & Greed Index, BTC Dominance, Total Market Cap, live BTC/ETH from Pyth

---

## Deploy to Vercel

### One-click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USER/pablito&env=NEXT_PUBLIC_WC_PROJECT_ID&envDescription=WalletConnect%20Project%20ID%20from%20cloud.walletconnect.com)

### Manual

**1. Push to GitHub**
```bash
git init && git add . && git commit -m "Pablito is checking your bags"
git remote add origin https://github.com/YOUR_USER/pablito.git
git push -u origin main
```

**2. Get a free WalletConnect Project ID**
→ [cloud.walletconnect.com](https://cloud.walletconnect.com) → New Project → copy the Project ID

**3. Import on Vercel**
→ [vercel.com/new](https://vercel.com/new) → Import repo → add env var:
```
NEXT_PUBLIC_WC_PROJECT_ID = your_project_id_here
```
→ Deploy ✓

---

## Run locally

```bash
git clone https://github.com/YOUR_USER/pablito.git
cd pablito
npm install
cp .env.example .env.local
# Add your WalletConnect Project ID to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and let Pablito check your bags.

---

## Tech stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Price oracle | [Pyth Network Hermes](https://hermes.pyth.network) via [pyth-mcp](https://github.com/aditya520/pyth-mcp) |
| Charts | Recharts + Pyth Benchmarks OHLC |
| Wallets | Web3Modal v3 + wagmi v2 (MetaMask, Rabby, WalletConnect, Coinbase, Rainbow…) |
| Data fetching | TanStack Query v5 (5s polling) |
| State | Zustand (localStorage) |
| Market data | alternative.me (Fear & Greed), CoinGecko (global market) |
| Deploy | Vercel |

---

## Environment variables

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_WC_PROJECT_ID` | **Yes** | [cloud.walletconnect.com](https://cloud.walletconnect.com) (free) |

No other API keys needed. All price data comes from free public endpoints.

---

*Pablito is checking your bags…*

<!-- last synced via Cowork -->
