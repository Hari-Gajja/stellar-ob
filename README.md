# StellarFund

> A decentralized crowdfunding platform powered by **Soroban Smart Contracts** on the **Stellar Network**.

<p align="center">
  <img src="./screenshots/campaign-donation.png" alt="StellarFund Campaign" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Soroban-Smart%20Contracts-000000" alt="Soroban" />
  <img src="https://img.shields.io/badge/Rust-Latest-orange?logo=rust" alt="Rust" />
  <img src="https://img.shields.io/badge/Stellar-Testnet-7D00FF" alt="Stellar" />
  <img src="https://img.shields.io/badge/License-MIT-success" alt="License" />
</p>

---

## Overview

**StellarFund** is a decentralized crowdfunding platform built on the **Stellar Network** using **Soroban Smart Contracts**.

The platform enables users to securely contribute **XLM** to crowdfunding campaigns while maintaining complete ownership of their wallets. Campaign progress, contributor counts, and recent donations are synchronized from the blockchain through polling-based state reads.

Built as part of the **Stellar Developer Belt Program -- Yellow Belt (Level 2)**.

---

## Features

- Multi-wallet authentication with StellarWalletsKit (Freighter, xBull, Albedo, Rabet, Lobstr)
- Soroban Smart Contract deployed on Stellar Testnet
- Campaign creation with title, description, goal, deadline, and category
- Secure XLM donation flow with transaction lifecycle tracking
- Campaign search, filtering (all / active / closed), and sorting (newest / most funded / ending soon)
- Live fundraising progress bars and stat cards
- Auto-refreshing campaign data and donation lists via polling
- Transaction lifecycle dashboard (Signing -> Submitting -> Pending -> Confirmed -> Failed)
- Stellar Expert transaction explorer integration with copy-to-clipboard
- Toast notification system for success, error, warning, and info messages
- Comprehensive error handling across contract, service, UI, and API layers
- Fully responsive UI with Tailwind CSS and Framer Motion
- Netlify serverless RPC proxy functions

---

## Live Demo

> [stellar-fundd.netlify.app](https://stellar-fundd.netlify.app/)

---

## Network

**Stellar Testnet**

---

## Smart Contract

**Contract ID**

```
CCYJOPGDQSZ2XVR4QCP67RAIFZRVDNXVYT2LRO2U4AJ2XL5D66M3PDYX
```

**View Contract**

https://stellar.expert/explorer/testnet/contract/CCYJOPGDQSZ2XVR4QCP67RAIFZRVDNXVYT2LRO2U4AJ2XL5D66M3PDYX

---

## Screenshots

### Campaign & Donation View

![Campaign Donation](./screenshots/campaign-donation.png)

---

### Wallet Selection

![Wallet Selection](./screenshots/wallet.png)

---

### Wallet Connection Request

![Wallet Request](./screenshots/wallet-req.png)

---

### Successful Transaction

![Transaction Success](./screenshots/succesful-transaction.png)

---

## Yellow Belt Requirements Checklist

- [x] StellarWalletsKit Integration
- [x] Multi-wallet Support
- [x] Soroban Smart Contract
- [x] Contract Deployed to Testnet
- [x] Smart Contract Called from Frontend
- [x] Read Contract State
- [x] Write Contract State
- [x] Contract Event Emission
- [x] Real-Time Event Synchronization
- [x] Transaction Status Tracking
- [x] Transaction Hash Display
- [x] Explorer Link
- [x] Error Handling
- [x] Responsive Design
- [x] Public GitHub Repository

---

## Architecture

```
                         User
                           |
                           v
                   React Frontend
                  (Netlify / Vercel)
                    |         |
                    v         v
          Netlify Functions   StellarWalletsKit
                    |              |
                    v              v
           Soroban RPC       Freighter / xBull /
                    |        Albedo / Rabet / Lobstr
                    v
           Soroban Smart Contract
                    |
                    v
         Stellar Testnet Blockchain
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge |
| Wallets | StellarWalletsKit |
| Blockchain | Stellar Network |
| Smart Contracts | Soroban SDK (Rust) |
| Build Tool | Vite |
| Serverless | Netlify Functions |
| Deployment | Netlify / Vercel |
| Explorer | Stellar Expert |

---

## Project Structure

```
stellar-yb/
|
|-- smart-contracts/
|   |-- contracts/
|       |-- crowdfunding/
|           |-- src/
|           |   |-- lib.rs          # Contract logic + error types + events
|           |   |-- test.rs         # Unit tests
|           |-- Cargo.toml
|           |-- test_snapshots/
|
|-- frontend/
|   |-- netlify/
|   |   |-- functions/
|   |       |-- rpc-proxy.ts        # Soroban RPC proxy
|   |       |-- contract-call.ts    # Generic contract method caller
|   |       |-- get-campaign.ts     # Campaign data with XDR decoding
|   |       |-- get-donations.ts    # Donation data with XDR decoding
|   |
|   |-- src/
|   |   |-- components/
|   |   |   |-- CampaignCard.tsx     # Campaign grid card
|   |   |   |-- TransactionStatus.tsx # Transaction lifecycle UI
|   |   |
|   |   |-- contexts/
|   |   |   |-- AppContext.tsx       # Wallet, Campaign, Transaction, Toast providers
|   |   |
|   |   |-- hooks/
|   |   |   |-- useToast.tsx         # Standalone toast hook
|   |   |
|   |   |-- pages/
|   |   |   |-- Home.tsx            # Campaign listing + search/filter/sort
|   |   |   |-- CampaignDetail.tsx  # Single campaign view + donation form
|   |   |   |-- CreateCampaign.tsx  # Campaign creation form
|   |   |
|   |   |-- services/
|   |   |   |-- wallet.ts           # StellarWalletsKit integration
|   |   |   |-- contract.ts         # Contract read/write helpers
|   |   |   |-- generated/          # Auto-generated contract SDK
|   |   |
|   |   |-- types/
|   |   |   |-- index.ts            # CampaignData, TransactionState, events, etc.
|   |   |
|   |   |-- utils/
|   |   |   |-- format.ts           # truncateAddress, stroopsToXlm, etc.
|   |   |
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |
|   |-- netlify.toml
|   |-- package.json
|   |-- vite.config.ts
|
|-- screenshots/
|-- DEPLOYMENT.md
|-- netlify.toml
|-- README.md
```

---

## Smart Contract

The crowdfunding contract is written in Rust using the **Soroban SDK**.

### ContractError Enum

| Code | Variant | Trigger |
|------|---------|---------|
| 1 | `AlreadyInitialized` | Contract initialized more than once |
| 2 | `NotInitialized` | Contract state accessed before init |
| 3 | `Unauthorized` | `require_auth()` check fails |
| 4 | `InvalidAmount` | Donation amount <= 0 |
| 5 | `InvalidGoal` | Funding goal <= 0 or deadline in the past |
| 6 | `CampaignNotFound` | Campaign ID does not exist |
| 7 | `CampaignClosed` | Donating to or closing an inactive campaign |
| 8 | `CampaignExpired` | Donating past campaign deadline |

### Main Functions

| Function | Description |
|----------|-------------|
| `initialize()` | One-time contract initialization |
| `create_campaign()` | Create a new crowdfunding campaign |
| `donate()` | Donate XLM to a campaign |
| `close_campaign()` | Close a campaign (owner only) |
| `get_campaign()` | Get campaign details by ID |
| `get_all_campaigns()` | Get all campaigns |
| `get_recent_donations()` | Get recent donations with limit |
| `get_contributors()` | Get contributor address list |

### CampaignData Storage

| Field | Type | Description |
|-------|------|-------------|
| `id` | u32 | Unique campaign ID |
| `owner` | Address | Campaign creator |
| `name` | String | Campaign title |
| `description` | String | Campaign description |
| `funding_goal` | i128 | Target amount (stroops) |
| `total_raised` | i128 | Total amount raised (stroops) |
| `contributor_count` | u32 | Number of unique donors |
| `created_at` | u64 | Creation ledger timestamp |
| `deadline` | u64 | Campaign end timestamp |
| `active` | bool | Whether campaign is open |

### Contract Events

| Event | Fields |
|-------|--------|
| `CampaignCreated` | owner, campaign_id, name, funding_goal, deadline, timestamp |
| `DonationReceived` | campaign_id, donor, amount, timestamp |
| `CampaignClosed` | campaign_id, timestamp |

---

## Wallet Support

**Supported Wallets**

- Freighter
- xBull
- Albedo
- Rabet
- Lobstr

**Wallet Features**

- Connect via auth modal (StellarWalletsKit)
- Disconnect
- Display wallet address
- Address auto-reconnect on page load
- Sign Soroban transactions

---

## Donation Workflow

```
User Connects Wallet
         |
         v
Browse Campaigns (search/filter/sort)
         |
         v
Select Campaign -> View Details
         |
         v
Enter Donation Amount
         |
         v
Approve in Wallet (signing)
         |
         v
Transaction Submitted (submitting)
         |
         v
Pending Confirmation
         |
         v
Confirmed / Failed
         |
         v
UI Auto-Refreshes
```

---

## Transaction Lifecycle

```
Idle -> Signing -> Submitting -> Pending -> Confirmed
                                              \
                                               -> Failed
```

**Displayed Information**

- Current status with icon and description
- Transaction hash (on confirmed)
- Stellar Expert explorer link (on confirmed/pending)
- Error message (on failed)
- Dismiss button

---

## Error Handling

**Smart Contract (Rust)**
- 8 typed `ContractError` variants with `panic_with_error!`
- `require_auth()` authorization enforcement
- Panic-based transaction revert on all invalid states

**Frontend Context Layer**
- `CampaignProvider`: error state with `try/catch/finally` and user-facing messages
- `TransactionProvider`: state machine with error capture + re-throw
- `ToastProvider`: error notifications (8s duration, red styling, auto-dismiss)
- Context guard pattern (`useXxx must be used within a XxxProvider`)

**Page-Level Validation**
- Form validation with toast errors for empty/invalid fields
- Campaign closed/expired check before donation
- Wallet-not-connected guard with connect prompt
- Campaign not found fallback UI

**Transaction Component**
- Displays `state.error` in a styled failure card with red X icon
- Handles all lifecycle states: signing, submitting, pending, confirmed, failed

**Netlify Functions**
- HTTP status codes (400/404/405/500) with structured JSON error responses
- Missing config checks, simulation errors, decode errors
- Catch-all with error message propagation

**Wallet Service**
- Silent catch for `getStoredAddress()` (returns null if not connected)

---

## Installation

**Clone repository**

```bash
git clone https://github.com/Hari-Gajja/stellar-yb.git
cd stellar-yb
```

**Install frontend**

```bash
cd frontend
npm install
```

**Install contract dependencies**

```bash
cd smart-contracts/contracts/crowdfunding
cargo build
```

---

## Environment Variables

Create `frontend/.env`:

```env
VITE_RPC_URL=https://soroban-testnet.stellar.org
VITE_NETWORK=testnet
VITE_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
VITE_CONTRACT_ID=CCYJOPGDQSZ2XVR4QCP67RAIFZRVDNXVYT2LRO2U4AJ2XL5D66M3PDYX
```

---

## Running Locally

**Frontend**

```bash
cd frontend
npm run dev
```

**Smart Contract Tests**

```bash
cd smart-contracts/contracts/crowdfunding
cargo test
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on:
- Smart contract build, deploy, and initialize
- Frontend build and deploy (Netlify, Vercel, Docker, static hosting)
- Environment variable configuration
- Mainnet migration guide
- Troubleshooting common issues

---

## Testing

**Frontend**

```bash
cd frontend
npm test
```

**Smart Contract**

```bash
cd smart-contracts/contracts/crowdfunding
cargo test
```

---

## Explorer

**Contract**

https://stellar.expert/explorer/testnet/contract/CCYJOPGDQSZ2XVR4QCP67RAIFZRVDNXVYT2LRO2U4AJ2XL5D66M3PDYX

**Transaction Example**

https://stellar.expert/explorer/testnet/tx/YOUR_TRANSACTION_HASH

---

## Future Improvements

- Campaign images / media uploads
- Campaign owner dashboard with analytics
- Withdraw funds for campaign owners
- Donor leaderboard
- Push notifications
- Mainnet deployment
- Category-based browsing

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "feat: add my feature"`)
4. Push (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## Author

**Hari Gajja**

- GitHub: https://github.com/Hari-Gajja
- LinkedIn: https://linkedin.com/in/hari-gajja

---

## License

MIT License

---

## Acknowledgements

- Stellar Development Foundation
- Soroban SDK
- StellarWalletsKit
- React, Tailwind CSS, Framer Motion

---

<p align="center">
  Built with the Stellar Network.
  <br />
  <a href="https://github.com/Hari-Gajja/stellar-yb">GitHub</a>
  
  </p>
