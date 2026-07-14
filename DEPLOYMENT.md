# Deployment Guide

Complete deployment instructions for the StellarFund crowdfunding platform.

---

## 📋 Prerequisites

| Tool | Version | Install Command |
|------|---------|-----------------|
| **Node.js** | 20+ | `nvm install 20` |
| **Rust** | 1.75+ | `rustup update` |
| **Stellar CLI** | Latest | `cargo install stellar-cli` |
| **Soroban CLI** | Latest | `cargo install --locked soroban-cli` |
| **Wallet** | Any | Freighter, xBull, Albedo, Rabet, or Lobstr |

---

## 🏗 Smart Contract Deployment

### 1. Build the Contracts

```bash
cd smart-contracts

# Build both optimized WASM binaries
cargo build --target wasm32v1-none --release -p treasury
cargo build --target wasm32v1-none --release -p crowdfunding

# Verify WASM files exist
ls -lh target/wasm32v1-none/release/*.wasm
```

**Output:**
- `treasury.wasm` (~7KB optimized)
- `crowdfunding.wasm` (~29KB optimized)

### 2. Configure Stellar Network

```bash
# Add testnet configuration
stellar network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 3. Deploy Treasury Contract (Contract B)

```bash
# Deploy treasury first
TREASURY_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/treasury.wasm \
  --source <YOUR_ACCOUNT> \
  --network testnet \
  --alias treasury)

echo "Treasury Contract ID: $TREASURY_ID"

# Initialize treasury with admin
ADMIN_ADDRESS=$(stellar keys address <YOUR_ACCOUNT>)
stellar contract invoke \
  --id $TREASURY_ID \
  --source <YOUR_ACCOUNT> \
  --network testnet \
  -- \
  initialize --admin $ADMIN_ADDRESS
```

### 4. Deploy Crowdfunding Contract (Contract A)

```bash
# Deploy crowdfunding with treasury address
CROWDFUNDING_ID=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/crowdfunding.wasm \
  --source <YOUR_ACCOUNT> \
  --network testnet \
  --alias crowdfunding)

echo "Crowdfunding Contract ID: $CROWDFUNDING_ID"

# Initialize crowdfunding with treasury address
stellar contract invoke \
  --id $CROWDFUNDING_ID \
  --source <YOUR_ACCOUNT> \
  --network testnet \
  -- \
  initialize --treasury_address $TREASURY_ID
```

**Save both Contract IDs** — you'll need them for frontend config.

### 5. Create a Campaign

```bash
CONTRACT_ID=$(stellar contract id --alias crowdfunding --network testnet)

stellar contract invoke \
  --id $CONTRACT_ID \
  --source <OWNER_ACCOUNT> \
  --network testnet \
  -- \
  create_campaign \
  --owner <OWNER_ADDRESS> \
  --name "Open Source Tooling Fund" \
  --description "Support the next generation of Stellar builders." \
  --funding_goal 25000000000000 \
  --deadline <FUTURE_TIMESTAMP>
```

> ⚠️ **Amounts are in stroops** (1 XLM = 10,000,000 stroops).  
> Example: 2,500 XLM = 25,000,000,000,000 stroops.

### 6. Verify Deployment

```bash
# Check campaign state
stellar contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- \
  get_campaign --campaign_id 1
```

Expected output shows your campaign with `total_raised: 0` and `status: Active`.

---

## 🌐 Frontend Deployment

### 1. Environment Configuration

Create `frontend/.env`:

```env
# Required: Your deployed contract IDs
VITE_CONTRACT_ID=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_TREASURY_CONTRACT_ID=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Testnet (default)
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_RPC_URL=https://soroban-testnet.stellar.org

# Mainnet (when ready)
# VITE_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
# VITE_RPC_URL=https://soroban-mainnet.stellar.org

# Optional: Custom Horizon/Explorer
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

### 2. Build & Test Locally

```bash
cd frontend

# Install dependencies
npm install

# Development server (with HMR)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test
```

### 3. Deploy to Vercel (Recommended)

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
cd frontend
vercel --prod
```

#### Option B: GitHub Integration (Auto-Deploy)

1. Push repo to GitHub
2. Connect repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Configure environment variables (see below)
4. Deploy — auto-deploys on every push to main

### 4. Vercel Environment Variables

In Vercel Project Settings → Environment Variables, add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_CONTRACT_ID` | Your crowdfunding contract ID | Production, Preview |
| `VITE_TREASURY_CONTRACT_ID` | Your treasury contract ID | Production, Preview |
| `VITE_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | Production, Preview |
| `VITE_RPC_URL` | `https://soroban-testnet.stellar.org` | Production, Preview |
| `VITE_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Production, Preview |
| `VITE_EXPLORER_URL` | `https://stellar.expert/explorer/testnet` | Production, Preview |

---

## 🔧 Alternative Deployments

### Netlify

```bash
cd frontend
npm run build

# Deploy via Netlify CLI
npx netlify deploy --prod --dir=dist
```

### Docker

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t stellar-fund-frontend ./frontend
docker run -p 80:80 stellar-fund-frontend
```

### Static Hosting (GitHub Pages, Cloudflare Pages, etc.)

```bash
cd frontend
npm run build
# Upload `dist/` folder to your static host
```

---

## ✅ Verification Checklist

### Smart Contract

- [ ] WASM builds without warnings (`cargo build --release`)
- [ ] All tests pass (`cargo test`)
- [ ] Contract deployed to testnet
- [ ] Contract ID saved
- [ ] Campaign initialized by owner
- [ ] `get_campaign` returns correct initial state

### Frontend

- [ ] `.env` configured with correct contract ID
- [ ] `npm run build` succeeds without errors
- [ ] `npm test` passes
- [ ] Wallet connection works (testnet)
- [ ] Campaign data loads from contract
- [ ] Donation flow works end-to-end
- [ ] Transaction status updates in real-time
- [ ] Explorer links open correctly
- [ ] Error toasts appear for failures

### Production Readiness

- [ ] Vercel/Netlify environment variables set
- [ ] Custom domain configured (optional)
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] Analytics/privacy policy (if required)

---

## 🔐 Mainnet Deployment (When Ready)

### Smart Contract

```bash
# Add mainnet
stellar network add mainnet \
  --rpc-url https://soroban-mainnet.stellar.org \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Deploy to mainnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/crowdfunding.wasm \
  --source <MAINNET_ACCOUNT> \
  --network mainnet \
  --alias crowdfunding-mainnet
```

### Frontend

Update Vercel environment variables:

```env
VITE_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
VITE_RPC_URL=https://soroban-mainnet.stellar.org
VITE_HORIZON_URL=https://horizon.stellar.org
VITE_EXPLORER_URL=https://stellar.expert/explorer/public
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `stellar contract deploy` fails | Ensure `stellar-cli` is latest; check account has XLM for fees |
| Contract invoke "NotInitialized" | Run `initialize_campaign` first |
| Frontend can't connect to RPC | Verify `VITE_RPC_URL` is accessible; check CORS |
| Wallet not detected | Ensure wallet extension is installed & unlocked |
| Transaction fails | Check toast error; verify donor has sufficient XLM + fees |
| Events not syncing UI | Check browser console for Soroban RPC event stream errors |

---

## 📞 Support

- **Stellar Discord**: #soroban, #developers
- **Soroban Docs**: https://developers.stellar.org/docs/build/smart-contracts
- **Stellar Expert**: https://stellar.expert (explorer)

---

<p align="center">
  <sub>Built for the Stellar Yellow Belt Challenge • MIT Licensed</sub>
</p>