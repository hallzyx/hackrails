# HackRails

HackRails is an organizer-sponsored platform for remote MCP tools. Participants use official event knowledge, strategy validation, and submission audits from Codex, Claude Code, Cursor, or another MCP-compatible agent without managing wallets. The organizer controls access, policy, sponsorship, and observability.

The API is the policy and payment authority. PostgreSQL is the usage ledger. The API is the only service allowed to use the organizer Hedera private key; browsers, MCP clients, and the premium provider never receive it.

## Demo video

Watch the HackRails demo: [https://youtu.be/xs5XYLRnbo4](https://youtu.be/xs5XYLRnbo4)

Wallets used in the demo:

- `0.0.8219587` — organizer wallet holding the sponsor budget that funded the x402 payments.
- `0.0.7974311` — HackRails wallet that received the USDC for each premium tool call.

## Start here

### Fastest local demo

Prerequisites: Node.js 22+, npm 10+, Docker Engine, and Docker Compose v2.

```bash
cp .env.example .env
npm install
docker compose up --build -d --wait
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the local admin key and keep real Hedera settlement as the default:

```dotenv
DEMO_ADMIN_KEY=use-a-local-demo-key
DEMO_MODE=false
```

With `DEMO_MODE=false`, premium calls use real Hedera Testnet transactions. Set `DEMO_MODE=true` only when testing UI or non-payment flows without spending funds.

Open:

- Admin dashboard: http://localhost:3000/
- Participant dashboard: http://localhost:3000/team
- API health: http://localhost:4000/health
- MCP health: http://localhost:4001/health
- Provider health: http://localhost:4002/health

For the complete setup, troubleshooting, and local Node workflow, read [Getting Started](docs/GETTING_STARTED.md).

## Documentation index

README is the entry point. Continue with the document that matches the work you are doing:

| Document | Use it when you need to… |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Understand services, trust boundaries, request flows, and data ownership |
| [Getting Started](docs/GETTING_STARTED.md) | Install, start, verify, and troubleshoot a local stack |
| [Configuration](docs/CONFIGURATION.md) | Configure settlement, services, and secrets |
| [MCP and Agent Skill](docs/MCP_AND_AGENT_SKILL.md) | Connect a coding agent and understand the available tools |
| [x402 and Hedera](docs/X402_HEDERA.md) | Enable or debug canonical Testnet settlement |
| [Operations](docs/OPERATIONS.md) | Run resets, seed activity, inspect logs, and operate the demo |
| [Testing](docs/TESTING.md) | Run automated checks and the manual smoke test |
| [Security](docs/SECURITY.md) | Review credential boundaries and production hardening |
| [Product specification](hackrails-product-spec.md) | Read the detailed product, UX, architecture, and MVP decisions |

## Product model

HackRails combines five capabilities:

1. **Organizer knowledge** — official rules, judging criteria, sponsor objectives, clarifications, and rejection patterns in `organizer-knowledge/`.
2. **Agent Skill** — free workflow instructions in `packages/hackrails-skill/`.
3. **Remote MCP** — participant-facing tools at `POST /mcp` on port 4001.
4. **Sponsor Gateway** — API authentication, quota reservation, validation, ledger, and x402 buyer flow on port 4000.
5. **Hedera settlement** — canonical x402 exact USDC settlement through the provider on port 4002.

Participants consume sponsored capabilities. They do not pay, sign transactions, or receive private wallet credentials.

## Available tools

| Tool | Type | Purpose | Current policy |
| --- | --- | --- | --- |
| `get_event_guidance` | Free | Official event rules, sources, dates, tracks, and submission requirements | Unlimited in the current catalog |
| `validate_project_strategy` | Premium | Validate project fit against organizer knowledge and sponsor objectives | 3 calls/team at `0.01 USDC` |
| `audit_submission` | Premium | Audit repository evidence, criteria, and submission blockers | 2 calls/team at `0.05 USDC` |

> **Demo data notice**
>
> The organizer intelligence used by `validate_project_strategy` and
> `audit_submission` is a synthetic, curated dataset created for the HackRails
> MVP using the current competition as context.
>
> It demonstrates how official rules, historical projects, sponsor objectives,
> clarifications, rejection patterns, and submission criteria would be supplied
> or approved by a real hackathon organizer in production.
>
> The dataset must not be interpreted as official statements, historical results,
> or private judging information published by Hedera.

The current aggregate premium allowance is:

```text
3 × 0.01 USDC + 2 × 0.05 USDC = 0.13 USDC per team/day
```

Policy is enforced before payment. A rejection is recorded as `REJECTED` with no quota consumption and no payment. A successful premium call is `SETTLED` only after the x402 facilitator reports successful settlement.

Tool price and quota editing is not yet exposed in the admin UI. See the configuration caveat in [Architecture](docs/ARCHITECTURE.md#current-configuration-caveat) before changing catalog values manually.

## Runtime topology

```text
Participant agent
        │ MCP + bearer token
        ▼
Remote MCP server :4001
        │ internal API request
        ▼
API / Sponsor Gateway :4000 ───── PostgreSQL :5432
        │ premium x402 request
        ▼
Premium provider :4002 ───── x402 facilitator ───── Hedera Testnet
```

The web dashboard runs on port 3000 and talks to the API. See [Architecture](docs/ARCHITECTURE.md) for the complete flow and trust model.

## Settlement configuration

`DEMO_MODE=false` is the default and enables canonical x402 Testnet settlement. It requires:

```dotenv
HEDERA_ACCOUNT_ID=0.0.x
HEDERA_PRIVATE_KEY=...
HEDERA_RECIPIENT_ACCOUNT_ID=0.0.y
```

The private key stays API-only. Read [x402 and Hedera](docs/X402_HEDERA.md) for the real settlement flow.

## Hedera Testnet evidence

The following public Testnet transactions correspond to the premium tool calls used as submission evidence:

| Premium tool | HashScan transaction |
| --- | --- |
| `validate_project_strategy` | [View transaction](https://hashscan.io/testnet/transaction/0.0.7162784@1785289856.301350719) |
| `audit_submission` | [View transaction](https://hashscan.io/testnet/transaction/0.0.7162784@1785289942.702732943) |

These transactions are evidence of the two sponsored x402 settlements; they do not represent official Hedera judging results.

## Repository map

```text
apps/
  api/        API, policy engine, PostgreSQL access, x402 buyer
  mcp/        Remote MCP transport and API forwarding
  provider/   x402 resource server and premium execution
  web/        Admin and participant dashboards
packages/
  shared/             Shared types and premium validators
  hackrails-skill/   Agent Skill and participant workflows
organizer-knowledge/ Curated organizer sources
db/init/              PostgreSQL schema and indexes
docs/                 Maintainer and user documentation
```

## Development commands

```bash
npm install
npm run dev
npm run seed
npm run typecheck
npm run test
npm run test -w @hackrails/mcp
npm run build
docker compose config --quiet
```

`npm run dev` starts API, provider, MCP, and web concurrently. The standard stack expects real Hedera configuration.

## Project status and scope

The repository is a production-shaped MVP. The current scope includes:

- organizer-backed strategy and submission validators;
- participant bearer access and dashboard;
- free and premium MCP tools;
- canonical Hedera x402 settlement;
- canonical Hedera x402 buyer/provider flow;
- usage reservations, idempotency, failure recovery, and dashboard metrics;
- downloadable Agent Skill and MCP import configurations.

The current MVP does not include:

- multi-organizer identity and role management;
- production secret management, TLS, rate limiting, or backup automation;
- video validation;
- admin editing of tool prices and quotas;
- event-scoped tool catalogs.

Intentional limitations and future work should be recorded in the product specification or a focused document under `docs/`.

## Verification

Before opening a pull request or demoing a change:

```bash
npm run typecheck
npm run test
npm run test -w @hackrails/mcp
npm run build
docker compose config --quiet
```

Then run the manual smoke test in [Testing](docs/TESTING.md) and inspect `docker compose ps`.

## Documentation conventions

- Keep README as the navigation index and high-level contract.
- Put detailed operational or architectural material in `docs/`.
- Keep product decisions in `hackrails-product-spec.md`.
- Keep event-specific source material in `organizer-knowledge/`.
- Update links and verification commands when runtime behavior changes.

## License

HackRails is licensed under the MIT License.
