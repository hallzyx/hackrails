---
name: hackrails-participant
description: "Trigger: use HackRails participant MCP tools for hackathon guidance, strategy validation, or submission audits."
license: Apache-2.0
metadata:
  author: HackRails
  version: "2.0.0"
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
| Inputs missing | Call `get_event_guidance` to resolve event details; then ask the user for remaining required fields. |
| Concrete project strategy | Call `validate_project_strategy` with all required fields. |
| Submission ready for audit | Call `audit_submission` with all required fields. |
| Transport failure | Retry once or recover with the same idempotency key. |
| Policy rejection | Stop; surface policy message and organizer escalation path. |

## Tool Input Schemas

### validate_project_strategy

Required fields (all mandatory unless noted):

| Field | Type | Description |
| --- | --- | --- |
| `event_id` | string | The event identifier. Use `"hedera-x402-demo"` for the current event. |
| `project_name` | string (1-200) | Name of the project. |
| `project_summary` | string (1-5000) | What the project does, core mechanism, and x402 integration. |
| `problem` | string (1-3000) | The problem being solved. |
| `target_users` | string (1-500) | Who will use the product. |
| `selected_track` | string (1-200) | The bounty track being targeted (e.g. "Hedera x402 Bounty"). |
| `planned_integrations` | string[] (1-20 items) | Technologies and protocols planned (e.g. ["x402", "Hedera", "MCP"]). |
| `business_model` | string \| null (optional) | How the product makes money, if applicable. |
| `current_stage` | "IDEA" \| "PROTOTYPE" \| "MVP" \| "READY_TO_SUBMIT" | Development stage. |

Do NOT send `idea` or `track` — those are deprecated. The schema is strict and rejects unknown fields.

### audit_submission

Required fields (all mandatory unless noted):

| Field | Type | Description |
| --- | --- | --- |
| `event_id` | string | The event identifier. Use `"hedera-x402-demo"` for the current event. |
| `project_name` | string (1-200) | Name of the project. |
| `repository_url` | string (1-500) | Public GitHub repository URL. |
| `submission_url` | string \| null (optional) | Submission form URL if submitted. |
| `selected_track` | string (1-200) | The bounty track. |
| `project_summary` | string (1-5000) | Project description for evaluation. |
| `transaction_links` | string[] (max 20, defaults to []) | HashScan or Hedera transaction links. |
| `deadline` | ISO-8601 string \| null (optional) | Submission deadline in ISO-8601 format. |

Do NOT send `repositoryUrl` or `summary` — those are deprecated. The schema is strict and rejects unknown fields.

### get_event_guidance (free)

| Field | Type | Description |
| --- | --- | --- |
| `question` | string (1-2000) | A question about event rules, dates, eligibility, or submission requirements. |

## Execution Steps

1. Verify endpoint, participant token, active event, and active participant.
2. Use `validate_project_strategy` to evaluate project fit with all required fields from the schema above. Use `audit_submission` to check submission readiness with all required fields.
3. Extract settlement evidence and turn `strategic_fit_score`, `risks`, `prioritized_actions`, `historical_overlap`, `findings`, `fix_first`, and `final_recommendation` into a named, actionable checklist.
4. Example (placeholders only):

```js
const idempotencyKey = crypto.randomUUID();
const result = await mcp.callTool({
  name: "validate_project_strategy",
  arguments: {
    event_id: "hedera-x402-demo",
    project_name: "My Project",
    project_summary: "What it does and how x402 is used",
    problem: "The problem being solved",
    target_users: "Who uses it",
    selected_track: "Hedera x402 Bounty",
    planned_integrations: ["x402", "Hedera"],
    current_stage: "MVP"
  }
});
const evidence = result.structuredContent;
```

## Output Contract

Return the tool result, settlement evidence, and an explicit checklist. State any missing inputs, policy blocker, or recovery key used; never echo credentials.

## References

- `references/safety.md` — credential and sponsorship boundaries.
- `workflows/demo.md` — local preflight and recovery flow.
