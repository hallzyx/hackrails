# Testing and Verification

HackRails uses focused TypeScript tests plus workspace-level typechecking and production builds.

## Quick path

```bash
npm run typecheck
npm run test
npm run test -w @hackrails/mcp
npm run build
docker compose config --quiet
```

## Workspace commands

| Command | Coverage |
| --- | --- |
| `npm run test` | Provider and API tests from the root script |
| `npm run test -w @hackrails/mcp` | MCP transport, schema, and tool-list tests |
| `npm run typecheck` | Shared, provider, API, MCP, and web TypeScript checks |
| `npm run build` | Production compilation for all workspaces |
| `npm run build -w @hackrails/web` | Next.js production build |
| `npm run build -w @hackrails/api` | API compilation used by the Docker image |

## Test areas

### API policy and ledger

`apps/api/src/service.test.ts` covers:

- pending reservations;
- tool, participant, daily, and event capacity;
- the aggregate premium daily cap;
- reservation timeout fallback;
- idempotent replay;
- organizer guidance response;
- malformed input and admin authentication.

`apps/api/src/metrics.test.ts` covers settled, failed, and rejected dashboard metrics.

### x402 buyer flow

`apps/api/src/x402.test.ts` covers:

- payment requirement validation;
- network, asset, recipient, and amount pinning;
- timeout behavior;
- demo receipts.

These tests do not spend real Hedera funds.

### Provider

`apps/provider/src/index.test.ts` covers the provider HTTP resource and x402 challenge behavior.

### MCP

`apps/mcp/src/index.test.ts` covers:

- health response;
- bearer enforcement for tool calls;
- JSON-RPC tool discovery;
- forwarding behavior.

## Manual smoke test

1. Start the stack with Docker.
2. Confirm all health endpoints.
3. Open `/team` and authenticate with a participant token.
4. Confirm tool usage counters and Resources actions.
5. Use **Import MCP** and verify the generated configuration has the expected endpoint.
6. Run the free guidance tool.
7. In demo mode, run a premium tool and confirm `DEMO_MODE` settlement.
8. Inspect the admin ledger and confirm the usage state.

Do not run a live premium call merely to test the UI. Use `DEMO_MODE=true` unless the test explicitly targets Hedera Testnet settlement.

## Acceptance checklist

- [ ] Invalid participant tokens return `401`.
- [ ] Missing bearer tokens are rejected by MCP and API.
- [ ] Malformed tool payloads return validation errors.
- [ ] Policy rejection creates no payment and no quota consumption.
- [ ] Failed settlement releases reservations.
- [ ] Successful premium calls contain transaction and x402 metadata.
- [ ] Idempotent replay does not execute a second payment.
- [ ] Participant dashboard does not expose organizer private keys.
- [ ] Demo mode does not claim an on-chain transaction.

## CI recommendation

The project currently provides local verification commands but no committed CI workflow. A future CI job should run:

```bash
npm ci
npm run typecheck
npm run test
npm run test -w @hackrails/mcp
npm run build
```

## Related documents

- [Getting started](GETTING_STARTED.md)
- [Architecture](ARCHITECTURE.md)
- [Security](SECURITY.md)
