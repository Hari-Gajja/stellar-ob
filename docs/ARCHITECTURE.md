# Architecture: StellarFund Orange Belt Level 3

## Two-Contract Design

```
┌─────────────────────────────────────────────────────┐
│                   User (Browser)                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              React Frontend (React 19)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Wallet   │  │ Campaign │  │  Transaction     │   │
│  │  Context  │  │  Context │  │  State Machine   │   │
│  └─────┬────┘  └────┬─────┘  └────────┬─────────┘   │
│        │            │                 │              │
│  ┌─────▼────────────▼─────────────────▼──────────┐   │
│  │          Contract Service (contract.ts)         │   │
│  │    AssembledTransaction + Stellar SDK          │   │
│  └─────────────────────┬─────────────────────────┘   │
│                        │                              │
│  ┌─────────────────────▼─────────────────────────┐   │
│  │         Netlify Functions (RPC Proxy)          │   │
│  └─────────────────────┬─────────────────────────┘   │
└────────────────────────┼─────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Soroban RPC (Testnet)                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│            Crowdfunding Contract (A)                  │
│                                                       │
│  Storage:                                             │
│  ├─ Campaign(u32) → CampaignData                      │
│  ├─ Donations(u32) → Vec<DonationRecord>              │
│  ├─ Contributors(u32) → Vec<Address>                  │
│  ├─ Contributor(u32, Address) → i128 (balance)        │
│  ├─ CampaignCount → u32                               │
│  └─ TreasuryAddress → Address                         │
│                                                       │
│  Inter-contract calls → Treasury.deposit/withdraw     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Treasury Contract (B)                    │
│                                                       │
│  Storage:                                             │
│  ├─ Balance(u32) → i128                               │
│  ├─ Locked(u32) → bool                                │
│  └─ Admin → Address                                   │
└─────────────────────────────────────────────────────┘
```

## Campaign Lifecycle

```
                    ┌──────────┐
                    │  Active  │
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         (deadline              (owner
          passed +               closes
          goal met)             early)
              │                     │
              ▼                     ▼
        ┌────────────┐       ┌──────────┐
        │ Successful │       │  Closed  │
        └──────┬─────┘       └────┬─────┘
               │                  │
          (owner                (contributor
          withdraws)            refunds if
               │                goal not met)
               ▼                  │
        ┌──────────┐              │
        │  Closed  │◄─────────────┘
        └──────────┘
               ▲
               │
         (deadline passed
          + goal NOT met)
               │
        ┌──────────┐
        │  Failed  │
        └──────────┘

Statuses: Active → Successful → Closed  (goal met)
          Active → Failed → Closed       (goal not met)
          Active → Closed                (owner early close)
```

## Transaction Flow (Donation)

```
User clicks "Donate"
         │
         ▼
→ Wallet auth (require_auth)
         │
         ▼
→ Crowdfunding validates: amount > 0, campaign active, deadline > now
         │
         ▼
→ Inter-contract call: Treasury.deposit(campaign_id, amount)
         │
         ▼
→ Update storage: total_raised += amount, contributor balance += amount
         │
         ▼
→ Emit DonationReceived { campaign_id, donor, amount, timestamp }
```

## Event System

| Event | Emitted By | Fields |
|-------|-----------|--------|
| `CampaignCreated` | Crowdfunding | owner, campaign_id, name, funding_goal, deadline, timestamp |
| `DonationReceived` | Crowdfunding | campaign_id, donor, amount, timestamp |
| `CampaignClosed` | Crowdfunding | campaign_id, status, timestamp |
| `FundsWithdrawn` | Crowdfunding | campaign_id, owner, amount, timestamp |
| `RefundIssued` | Crowdfunding | campaign_id, contributor, amount, timestamp |
| `Deposited` | Treasury | campaign_id, amount |
| `Withdrawn` | Treasury | campaign_id, amount |

## Error Handling

### Contract Errors (Crowdfunding)

| Code | Error | Trigger |
|------|-------|---------|
| 1 | `AlreadyInitialized` | Contract initialized more than once |
| 2 | `NotInitialized` | Contract state accessed before init |
| 3 | `Unauthorized` | `require_auth()` check fails |
| 4 | `InvalidAmount` | Donation/refund amount <= 0 |
| 5 | `InvalidGoal` | Funding goal <= 0 or deadline in the past |
| 6 | `CampaignNotFound` | Campaign ID does not exist |
| 7 | `CampaignClosed` | Donating to or closing an inactive campaign |
| 8 | `CampaignExpired` | Donating past campaign deadline |
| 9 | `CampaignNotSuccessful` | Withdraw from non-successful campaign |
| 10 | `CampaignNotFailed` | Refund from non-failed campaign |
| 11 | `AlreadyRefunded` | Contributor already refunded |
| 12 | `WithdrawFailed` | No balance to withdraw |
| 13 | `RefundFailed` | Refund operation failed |

### Contract Errors (Treasury)

| Code | Error | Trigger |
|------|-------|---------|
| 1 | `NotInitialized` | Contract not initialized |
| 2 | `AlreadyInitialized` | Double initialization |
| 3 | `InsufficientBalance` | Not enough funds to withdraw |
| 4 | `Locked` | Campaign funds are locked |
| 5 | `Unauthorized` | Permission denied |
| 6 | `InvalidAmount` | Zero or negative amount |

## Testing Strategy

```
Contract Tests (Rust)                  Frontend Tests (React)
┌─────────────────────┐               ┌─────────────────────┐
│ Treasury (8 tests)   │               │ Format (6 tests)    │
│ ├─ deposit/balance   │               │ ├─ truncateAddress  │
│ ├─ withdraw          │               │ ├─ formatRelTime    │
│ ├─ lock/unlock       │               │                     │
│ ├─ edge cases        │               │ CampaignCard (6)    │
│                     │               │ ├─ render           │
│ Crowdfunding (9)     │               │ ├─ progress bar     │
│ ├─ create campaign   │               │ ├─ donate button    │
│ ├─ donate + treasury │               │ ├─ callbacks        │
│ ├─ withdraw funds    │               │                     │
│ ├─ refund            │               │ TransactionStatus   │
│ ├─ access control    │               │ ├─ all states       │
│ ├─ edge cases        │               │ ├─ onClose callback │
│ Total: 17 tests      │               │ Total: 18 tests     │
└─────────────────────┘               └─────────────────────┘
```
