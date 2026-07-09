# StellarFund

<p align="center">
  <img src="https://img.shields.io/badge/Stellar-Soroban-0066FF?style=for-the-badge&logo=stellar&logoColor=white" alt="Stellar Soroban" />
  <img src="https://img.shields.io/badge/Rust-1.75+-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Framer_Motion-11-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Smart_Contracts-Rust_+_Soroban_SDK_26-000000?style=flat&logo=rust" alt="Smart Contracts" />
  <img src="https://img.shields.io/badge/Frontend-React_19_+_TS_+_Vite_6-61DAFB?style=flat&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Styling-Tailwind_CSS_3.4_+_Framer_Motion-06B6D4?style=flat&logo=tailwindcss" alt="Styling" />
  <img src="https://img.shields.io/badge/Wallets-Stellar_Wallets_Kit-0066FF?style=flat&logo=stellar" alt="Stellar Wallets Kit" />
  <img src="https://img.shields.io/badge/Network-Testnet_Ready-0066FF?style=flat" alt="Testnet Ready" />
  <img src="https://img.shields.io/badge/License-MIT-000000?style=flat" alt="MIT License" />
</p>

---

A production-ready **decentralized crowdfunding platform** built on **Stellar's Soroban smart contracts**.

## ✨ Highlights

| Feature | Details |
|---------|---------|
| **Multi-Wallet Support** | Freighter, xBull, Albedo, Rabet, Lobstr via Stellar Wallets Kit |
| **Soroban Smart Contract** | Rust + Soroban SDK v26 with persistent storage & contract events |
| **Real-time Sync** | Automatic UI updates via contract event listeners |
| **Full TX Lifecycle** | Signing → Submitting → Pending → Confirmed/Failed |
| **Explorer Integration** | One-click Stellar Expert links, copy TX hash |
| **Minimalist UI** | Editorial layout, Framer Motion micro-interactions |
| **TypeScript + React 19** | Strict TS, Vite 6, modern React patterns |
| **Full Test Coverage** | Rust contract tests + Vitest frontend unit tests |

---

## 🏗 Architecture

```
Frontend (React 19 + TS)          Soroban Smart Contract (Rust)
┌─────────────────────────┐       ┌─────────────────────────────┐
│ Wallet / Campaign /     │       │ initialize_campaign         │
│ Donation / TX Contexts  │◄─────►│ donate                      │
│       │                 │       │ get_campaign                │
│       ▼                 │       │ get_total                   │
│ Stellar Wallets Kit     │       │ get_contributor_count       │
│ (5+ wallets)            │       │ get_recent_donations        │
│       │                 │       │                             │
│       ▼                 │       │ Events:                     │
│ Soroban RPC + Client    │       │ CampaignInitialized         │
│ (Stellar SDK)           │       │ DonationReceived            │
└───────────┬─────────────┘       │ CampaignGoalReached         │
            │ HTTPS               │                             │
            ▼                     │ Storage: Persistent         │
┌─────────────────────────────┐   │ Campaign, Donations, Count  │
│   SOROBAN CONTRACT          │   └─────────────────────────────┘
│   (WASM on Stellar)         │
└─────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `nvm install 20` |
| Rust | 1.75+ | `rustup update` |
| Stellar CLI | latest | `cargo install stellar-cli` |
| Soroban CLI | latest | `cargo install --locked soroban-cli` |

### 1. Smart Contract

```bash
cd smart-contracts

# Run tests
cargo test

# Build optimized WASM
cargo build --target wasm32v1-none --release
# Output: target/wasm32v1-none/release/crowdfunding.wasm
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your contract ID and network config

# Development server
npm run dev

# Production build
npm run build

# Run tests
npm test
```

### 3. Environment Variables

Create `frontend/.env`:

```env
# Required: Your deployed contract ID
VITE_CONTRACT_ID=CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Testnet (default)
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_RPC_URL=https://soroban-testnet.stellar.org

# Optional
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_EXPLORER_URL=https://stellar.expert/explorer/testnet
```

---

## 📁 Project Structure

```
stellar-fund/
├── smart-contracts/
│   ├── Cargo.toml
│   └── contracts/crowdfunding/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs      # Contract implementation
│           └── test.rs     # Contract tests
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── contexts/
│   │   │   └── AppContext.tsx     # Wallet, Campaign, TX, Toast providers
│   │   ├── services/
│   │   │   ├── wallet.ts          # Stellar Wallets Kit wrapper
│   │   │   └── contract.ts        # Contract client & method calls
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   ├── useCampaign.ts
│   │   │   ├── useDonation.ts
│   │   │   ├── useTransaction.ts
│   │   │   └── useToast.ts
│   │   ├── types/index.ts
│   │   ├── utils/format.ts
│   │   └── styles/index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── DEPLOYMENT.md
```

---

## 📜 Smart Contract API

### Write Operations

| Method | Parameters | Auth | Description |
|--------|------------|------|-------------|
| `initialize_campaign` | `owner: Address`, `name: String`, `description: String`, `funding_goal: i128` | Owner | Initialize campaign (once) |
| `donate` | `donor: Address`, `amount: i128`, `transaction_id: String` | Donor | Donate to campaign |

### Read Operations

| Method | Returns | Description |
|--------|---------|-------------|
| `get_campaign()` | `CampaignData` | Full campaign info |
| `get_total()` | `i128` | Total raised (stroops) |
| `get_contributor_count()` | `u32` | Unique donor count |
| `get_recent_donations(limit: u32)` | `Vec<DonationRecord>` | Recent donations |

### Events

| Event | Payload | Emitted When |
|-------|---------|--------------|
| `CampaignInitialized` | `owner, name, funding_goal, timestamp` | Campaign created |
| `DonationReceived` | `donor, amount, timestamp, transaction_id` | Donation received |
| `CampaignGoalReached` | `total_raised, funding_goal, timestamp` | Goal reached |

### Data Types

```rust
pub struct CampaignData {
    pub owner: Address,
    pub name: String,
    pub description: String,
    pub funding_goal: i128,
    pub total_raised: i128,
    pub is_active: bool,
}

pub struct DonationRecord {
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub transaction_id: String,
}
```

### Errors

| Code | Variant | Description |
|------|---------|-------------|
| 1 | `AlreadyInitialized` | Campaign already initialized |
| 2 | `NotOwner` | Caller is not campaign owner |
| 3 | `InvalidAmount` | Amount <= 0 |
| 4 | `CampaignInactive` | Campaign not active |
| 5 | `GoalAlreadyReached` | Funding goal already met |

---

## 🧱 Frontend Architecture

### Context Providers

| Provider | Responsibility |
|----------|----------------|
| `WalletProvider` | Connection state, address, signing, network |
| `CampaignProvider` | Campaign data, donations, progress, auto-refresh via events |
| `TransactionProvider` | TX lifecycle: `idle → signing → submitting → pending → confirmed/failed` |
| `ToastProvider` | Global notifications (success, error, info) |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `useWallet()` | `connect()`, `disconnect()`, `signTransaction()`, `address`, `isConnected` |
| `useCampaign()` | `campaign`, `donations`, `progress`, `refresh()`, `subscribeToEvents()` |
| `useDonation()` | `donate(amount)`, `validateAmount()`, form state |
| `useTransaction()` | `status`, `hash`, `error`, `reset()`, `pollForConfirmation()` |
| `useToast()` | `show(message, type)`, `dismiss()` |

### Services

| Service | Purpose |
|---------|---------|
| `wallet.ts` | Stellar Wallets Kit init, wallet selection modal, network config |
| `contract.ts` | Soroban RPC client, contract client creation, method invocation, event parsing |

---

## 🧪 Testing

### Smart Contract

```bash
cd smart-contracts
cargo test
```

**Tests:**
- `initialize_and_donate_flow` — Full campaign init + multiple donations + event verification
- `rejects_invalid_amount` — Rejects zero/negative donations

### Frontend

```bash
cd frontend
npm test
```

**Coverage:** Formatting utilities (XLM conversion, date formatting, address truncation)

---

## 🚢 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete instructions.

### Quick Reference

#### Smart Contract (Testnet)

```bash
cd smart-contracts

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/crowdfunding.wasm \
  --source <YOUR_ACCOUNT> \
  --network testnet

# Initialize (one-time, by owner)
stellar contract invoke \
  --id <CONTRACT_ID> \
  --source <OWNER_ACCOUNT> \
  --network testnet \
  -- initialize_campaign \
  --owner <OWNER_ADDRESS> \
  --name "Open Source Fund" \
  --description "Support Stellar builders" \
  --funding_goal 25000000000  # 25,000 XLM in stroops
```

#### Frontend (Vercel)

```bash
cd frontend
npm run build
vercel --prod
```

**Required Vercel Environment Variables:**
- `VITE_CONTRACT_ID`
- `VITE_NETWORK_PASSPHRASE`
- `VITE_RPC_URL`

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.#   s t e l l a r - f u n d  
 