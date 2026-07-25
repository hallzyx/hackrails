---
name: hackrails-participant
description: "Trigger: use HackRails participant MCP tools for hackathon guidance, strategy validation, or submission audits."
license: Apache-2.0
metadata:
  author: HackRails
  version: "1.0.0"
---

## Activation Contract

Load when using configured HackRails participant MCP tools for event guidance, project strategy validation, or submission auditing.

## Hard Rules

- A participant bearer token authorizes tool access only; never request, store, expose, or log organizer wallet credentials or Hedera private keys.
- Use free guidance to resolve missing inputs. Call premium tools only with concrete required inputs.
- Generate a fresh idempotency key for every new premium request; reuse that exact key only for replay or recovery.
- Premium access is organizer-sponsored. A policy rejection performs no provider work or payment: report it and never bypass or auto-retry it.
- Parse `structuredContent`; treat transaction ID, HashScan URL, `mode`, and `x402State` as settlement evidence, not advice.

## Decision Gates

| Condition | Action |
| --- | --- |
| Inputs missing | Call `get_event_guidance`; name the missing fields. |
| Concrete idea / submission ready | Call the matching premium tool with a new key. |
| Transport failure | Retry once or recover with the same key. |
| Policy rejection | Stop; surface policy message and organizer escalation path. |

## Execution Steps

1. Verify endpoint, participant token, active event, and active participant.
2. Use `validate_project_strategy` for a concrete `idea` (optional `track`); use `audit_submission` for a concise `summary` (optional public `repositoryUrl`).
3. Extract settlement evidence and turn `gaps`, `blockers`, `recommendedNext`, and scorecards into a named, actionable checklist.
4. Example (placeholders only):

```js
const idempotencyKey = crypto.randomUUID();
const result = await mcp.callTool({ name: "validate_project_strategy", arguments: { idea: "Accessible route planner", track: "Mobility", idempotencyKey } });
const evidence = result.structuredContent;
```

## Output Contract

Return the tool result, settlement evidence, and an explicit checklist. State any missing inputs, policy blocker, or recovery key used; never echo credentials.

## References

- `references/safety.md` — credential and sponsorship boundaries.
- `workflows/demo.md` — local preflight and recovery flow.
