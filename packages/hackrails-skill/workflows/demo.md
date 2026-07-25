# Participant Demo Workflow

## Local Preflight

1. Confirm web `http://localhost:3000`, API `http://localhost:4000/health`, MCP `http://localhost:4001/health`, and provider `http://localhost:4002/health` are reachable.
2. Obtain one selected participant bearer token from the organizer dashboard and keep it outside source control.
3. Confirm the event and participant are active before invoking a premium tool.

## Happy Path and Recovery

```js
const key = crypto.randomUUID();
const request = {
  name: "audit_submission",
  arguments: {
    summary: "Route planner with offline accessibility alerts",
    repositoryUrl: "https://example.invalid/team/project",
    idempotencyKey: key,
  },
};

const result = await mcp.callTool(request); // new premium request
// On a timeout or transport failure only:
const recovered = await mcp.callTool(request); // same key, replay/recovery
```

Use a newly generated key for the next premium request. Read `recovered.structuredContent` (or `result.structuredContent`) for the original settlement record, then convert its gaps, blockers, recommended next actions, and scorecards into the team's checklist. Do not retry a policy rejection; escalate its message to the organizer.
