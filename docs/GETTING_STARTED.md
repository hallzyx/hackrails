# Getting Started

This guide takes a contributor from a clean checkout to a working HackRails environment with real Hedera Testnet settlement enabled by default.

## Quick path: Docker

### Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Docker Engine with Docker Compose v2

### 1. Create local configuration

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the local admin key and live Hedera configuration in `.env`:

```dotenv
DEMO_ADMIN_KEY=use-a-local-value
DEMO_MODE=false
HEDERA_ACCOUNT_ID=0.0.x
HEDERA_PRIVATE_KEY=your-private-key
HEDERA_RECIPIENT_ACCOUNT_ID=0.0.y
```

Do not commit `.env`. It contains Hedera credentials.

For isolated UI or non-payment testing only, set `DEMO_MODE=true`. That path is not the standard runtime configuration.

### 2. Build and start the stack

```bash
npm install
docker compose up --build -d --wait
```

The API creates the event and participants automatically when the database is empty.

### 3. Open the interfaces

| Interface | URL |
| --- | --- |
| Admin dashboard | http://localhost:3000/ |
| Participant dashboard | http://localhost:3000/team |
| API health | http://localhost:4000/health |
| MCP health | http://localhost:4001/health |
| Provider health | http://localhost:4002/health |

The admin dashboard requires the value configured as `DEMO_ADMIN_KEY` for protected actions. Participant access uses a participant token and does not use the admin key.

### 4. Verify the stack

```bash
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
```

All services should report `healthy` in `docker compose ps`.

## Quick path: local Node processes

Use this mode when iterating on TypeScript without rebuilding containers.

```bash
docker compose up -d postgres
npm install
npm run seed
npm run dev
```

Local Node processes expect PostgreSQL at `localhost:5432`; the first command starts only that database container.

`npm run dev` starts the API, provider, MCP server, and web app concurrently.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start all four Node services in watch mode |
| `npm run seed` | Reset test fixtures; requires `DEMO_MODE=true` |
| `npm run build` | Build shared, provider, API, MCP, and web packages |
| `npm run typecheck` | Typecheck every workspace |
| `npm run test` | Run provider and API tests |
| `npm run test -w @hackrails/mcp` | Run MCP tests explicitly |
| `docker compose up --build -d --wait` | Build and start the complete stack |
| `docker compose logs -f api` | Follow API logs |
| `docker compose down` | Stop containers without deleting the database volume |
| `docker compose down -v` | Stop containers and delete local PostgreSQL data |

## First end-to-end walkthrough

1. Open the admin dashboard at `/`.
2. Enter the admin key.
3. Confirm the event is active.
4. Open `/team` or use the participant access action from the admin dashboard.
5. Connect the MCP configuration to a supported coding agent.
6. Call `get_event_guidance` first to inspect official event information.
7. Call a premium tool with complete required inputs.
8. Return to the admin dashboard and inspect quota, ledger state, and settlement details.

## Troubleshooting

### API exits during startup

Check:

- PostgreSQL is reachable;
- `DEMO_ADMIN_KEY` is set;
- `DEMO_MODE=false` or explicitly configured for isolated testing;
- `HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY`, and `HEDERA_RECIPIENT_ACCOUNT_ID` are set.

```bash
docker compose logs postgres
```

### The participant dashboard rejects the token

Use only the token value in the participant dashboard. The UI adds the `Bearer ` prefix when making requests. Do not paste the prefix into the input.

### The browser cannot reach the API

Check `NEXT_PUBLIC_API_URL`. For the standard local stack it must be:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Next step

Read [Architecture](ARCHITECTURE.md) before changing service boundaries or payment behavior.
