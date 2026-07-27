# Sponsor Objectives — Hedera x402

## Technologies to Incentivize

- **x402 protocol** — Core payment negotiation layer. Projects should demonstrate genuine understanding of the 402 → payment → retry cycle.
- **Hedera** — Settlement network. Projects should leverage Hedera's speed, low cost, and finality as a differentiator.
- **USDC on Hedera** — Preferred settlement asset for real-world payment scenarios, though HBAR is also accepted.

## Priority Use Cases

1. **Agent-per-query payments** — AI agents paying for API calls, data, or computation on demand.
2. **Sponsored access models** — Organizers or sponsors funding participant access to premium tools.
3. **Pay-to-read data marketplaces** — Gate content or data behind micropayments.
4. **Policy-controlled spending** — Budget limits, quotas, and programmatic spending controls.

## Recommended Integrations

- Integrate with the x402 facilitator for automated payment verification.
- Use HashScan for transparent transaction evidence.
- Show budget/quota mechanics to demonstrate real-world applicability.
- Demonstrate the payment flow is non-removable from the product value.

## Common Mistakes When Using the Technology

- Using x402 only for a single decorative transaction with no product integration.
- Failing to show the initial 402 response in the demo video.
- Using mainnet instead of Testnet for evidence.
- Not providing HashScan links in the submission.
- Treating the payment as an afterthought rather than a core feature.
- Building a generic marketplace wrapper without differentiating the use case.

## Technical Expectations

- The payment flow should be observable and auditable.
- Transactions should be verifiable via HashScan on Testnet.
- The payer and receiver should be different accounts.
- The transaction should relate to the demo, not be an unrelated transfer.
- The x402 protocol cycle should be end-to-end, not mocked or partial.