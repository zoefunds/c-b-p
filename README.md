# Africa Pay (Nigeria 🇳🇬 ↔ Ghana 🇬🇭)

Production-minded cross-border payment system with:

- Internal fiat ledgers (NGN/GHS)
- USDC settlement on Base testnet
- Modular services and blockchain relayer

## Phase 1 Goal

Bootstrap a production-grade monorepo and implement the first end-to-end mock transaction flow:

1. Debit sender NGN ledger
2. Convert NGN → USDC → GHS (mock FX)
3. Simulate settlement event
4. Credit receiver GHS ledger

## Repository Layout

- `apps/web`: Next.js frontend
- `services/*`: domain services
- `blockchain/contracts`: Solidity contracts
- `packages/*`: shared modules
- `infra/ci`: CI definitions
