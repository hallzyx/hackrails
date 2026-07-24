---
name: hackrails-participant
description: Use official HackRails organizer-backed tools during the hackathon.
---
# HackRails Participant Skill
Use the configured remote MCP server. Participant bearer tokens grant only tool access; never request, store, or expose organizer wallet credentials or Hedera private keys.

## Local preflight
1. Confirm the MCP endpoint and a participant bearer token are configured.
2. Confirm the organizer has enabled the event and the selected participant is active.
3. Generate a unique idempotency key for every premium call; reuse the same key only to recover its prior result.
4. If any input is unavailable, explain the missing field and use the free guidance tool when it can unblock the team.

## Tool selection
- `get_event_guidance`: free; use for rules, tracks, deliverables, sponsor objectives, and missing-input clarification.
- `validate_project_strategy`: premium; use only after the team can supply a concrete `idea` and optional `track`.
- `audit_submission`: premium; use near submission with a concise `summary` and optional public `repositoryUrl`.

## Sponsored premium use
Premium use is organizer-sponsored, not participant-funded. The Sponsor Gateway checks event state, participant state, per-tool quota, daily allowance, participant allocation, and event budget before it can reserve any spend. A rejection executes neither provider work nor payment; report the policy message and do not retry automatically.

The gateway performs an HTTP-visible x402 exact-scheme flow with the internal provider: initial request → HTTP 402 with `PAYMENT-REQUIRED` → sponsored Hedera USDC settlement → retry with `PAYMENT-SIGNATURE` → structured result plus `PAYMENT-RESPONSE`. Participants never receive wallet keys.

## Structured results
Read the returned `structuredContent` before acting. Treat `transaction.transactionId`, `hashscanUrl`, `mode`, and `x402State` as settlement evidence, not as advice. Convert result fields such as `gaps`, `blockers`, `recommendedNext`, and scorecards into an explicit team checklist. On an idempotent replay, use the original result rather than assuming another payment occurred.

Read `references/safety.md` and `workflows/demo.md` before handling credentials or demo execution.
