# Participant Demo Workflow

## Local Preflight

1. Confirm web `http://localhost:3000`, API `http://localhost:4000/health`, MCP `http://localhost:4001/health`, and provider `http://localhost:4002/health` are reachable.
2. Obtain one selected participant bearer token from the organizer dashboard and keep it outside source control.
3. Confirm the event and participant are active before invoking a premium tool.

## Happy Path and Recovery

```js
const key = crypto.randomUUID();

// Strategy validation
const strategyRequest = {
  name: "validate_project_strategy",
  arguments: {
    event_id: "hedera-x402-demo",
    project_name: "My x402 Project",
    project_summary: "What it does and how x402 is integrated",
    problem: "The problem being solved",
    target_users: "Who uses it",
    selected_track: "Hedera x402 Bounty",
    planned_integrations: ["x402", "Hedera"],
    current_stage: "MVP",
  },
};
const strategyResult = await mcp.callTool(strategyRequest);

// Submission audit
const auditRequest = {
  name: "audit_submission",
  arguments: {
    event_id: "hedera-x402-demo",
    project_name: "My x402 Project",
    repository_url: "https://github.com/team/project",
    selected_track: "Hedera x402 Bounty",
    project_summary: "Project description for evaluation",
    transaction_links: ["https://hashscan.io/testnet/transaction/0.0.xxx"],
  },
};
const auditResult = await mcp.callTool(auditRequest);

// On a timeout or transport failure only:
const recovered = await mcp.callTool(auditRequest); // same key, replay/recovery
```

Use a newly generated key for the next premium request. Read `structuredContent` for the original settlement record, then convert its `risks`, `prioritized_actions`, `findings`, `fix_first`, and `final_recommendation` into the team's checklist. Do not retry a policy rejection; escalate its message to the organizer.