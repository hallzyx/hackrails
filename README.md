# HackRails MVP
HackRails is a production-shaped MVP for organizer-sponsored remote MCP tools. The API owns policy, PostgreSQL ledger access, participant tokens, and Hedera credentials; browser and MCP clients never receive wallet credentials.

## Local and Docker
Copy `.env.example` to `.env`, set a local `DEMO_ADMIN_KEY`, then run `npm install`, `npm run seed`, and `npm run dev`. Docker runs `docker compose up --build` with PostgreSQL (5432), web (3000), API/Sponsor Gateway (4000), MCP (4001), and the internal premium provider (4002). Every service has a health endpoint or Docker healthcheck.

## HTTP-visible x402 flow
Premium tools use a separate provider at `POST /tools/:tool` protected by the canonical x402 v2 Hono middleware. The provider is a resource server using `@x402/core/server`, `@x402/hedera/exact/server`, `HTTPFacilitatorClient`, and `@x402/hono`; it has no Hedera private key. The API is the buyer/sponsor and uses the organizer Hedera key with `@x402/core/client`, `@x402/fetch`, and the Hedera exact client. The canonical Base64 `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, and `PAYMENT-RESPONSE` headers are handled by the x402 libraries.

Set `X402_FACILITATOR_URL`, `HEDERA_NETWORK` (default `hedera:testnet`), the USDC HTS asset (default `0.0.429274`), and a provider recipient account. The usage ledger stores the payment payload hash and facilitator settlement receipt on the existing `usage_records` row. A premium call is only marked `SETTLED` after the canonical x402 response reports successful settlement. The existing idempotency key is retained as the application replay guard.

## Hedera USDC
`DEMO_MODE=true` keeps deterministic non-chain ledger receipts for the existing product demo without the former HMAC proof protocol. Set `DEMO_MODE=false` plus `HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`, `HEDERA_RECIPIENT_ACCOUNT_ID`, and a Hedera-capable facilitator to execute canonical Testnet HTS USDC x402 settlement. Private keys remain API-only.

## Ledger and dashboard
Premium calls atomically reserve event, participant, daily, and per-tool quota before payment. Policy rejections are logged as `REJECTED` without quota or payment; failures are `FAILED`; successful calls are `SETTLED`. Seeded history is a closed session that stays visible in dashboard totals and transaction history while live participant quotas remain clean. The dashboard reports usage by tool/rate, average cost per participant, calls per team, failed payments, policy rejections, budget, calls, impact, transaction IDs, HashScan links, and x402 state.

## Agent skill
`packages/skill/SKILL.md` and `packages/skill/workflows/demo.md` cover preflight, missing input, sponsored-premium explanation, tool selection, idempotency, and structured-result interpretation.

## Verification
Run `npm run typecheck`, `npm run test`, `npm run build`, and `docker compose config --quiet`.
