# Judging Criteria — Hedera x402 Builder Sprint

## Primary Criteria

### 1. Working End-to-End Flow (30%)
- Does the payment flow actually work from start to finish?
- Is the HTTP 402 → payment → retry → response cycle demonstrable?
- Are there any manual steps that should be automated?

### 2. Real On-Chain x402 Payments (30%)
- Are transactions verifiable on Hedera Testnet via HashScan?
- Is the correct network (Testnet) used?
- Is the correct settlement asset (HBAR or USDC) used?
- Are payer and receiver accounts different?
- Does the transaction relate to the demo?

### 3. Effective Use of Hedera Rails (20%)
- Does the project leverage Hedera-specific capabilities beyond basic transfers?
- Is the integration non-trivial (not just a wrapper API call)?
- Does it show understanding of Hedera's strengths (speed, cost, finality)?

### 4. Originality and Differentiation (10%)
- Is the use case novel or a repeat of common patterns?
- Does it solve a real problem or is it a toy demo?
- Does it stand out from generic marketplace/wrapper submissions?

### 5. Quality of Submission (10%)
- Is the README clear and complete?
- Is the demo video coherent and within time limits?
- Are installation instructions usable by a judge?

## Integration Strength Classification

### Strong Integration
- x402 is central to the product's economic model, not a bolt-on.
- The payment flow is observable, auditable, and tied to a real resource or service.
- Hedera settlement is demonstrably part of the critical path.
- The project shows budget management, quotas, or policy enforcement.

### Superficial Integration
- x402 is used only for a single demo transaction with no product context.
- Hedera is mentioned but transactions are generic or irrelevant to the demo.
- The payment is decorative — removing it does not change the product's value.
- No evidence of payment policy, quotas, or sponsored access models.

## Tie-Breakers

1. Depth of x402 integration (more central wins).
2. Quality of on-chain evidence (more verifiable wins).
3. Clarity of documentation and demo.
4. Novelty of use case.