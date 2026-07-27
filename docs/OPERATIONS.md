# Operations and Demo Lifecycle

This guide covers routine local operation, demo resets, health checks, and safe inspection of the ledger.

## Quick path

```bash
```

Use the admin dashboard for normal demo controls. Use direct endpoints only for scripted verification.

## Service health

| Service | Health endpoint |
| --- | --- |
| API | `GET http://localhost:4000/health` |
| MCP | `GET http://localhost:4001/health` |
| Provider | `GET http://localhost:4002/health` |
| PostgreSQL | Docker `pg_isready` healthcheck |

Inspect status:

```bash
```

## Demo controls

The admin dashboard exposes:

- event activate, pause, and resume;
- demo reset;
- seeded historical activity;
- participant pause/resume;
- participant usage reset;
- participant token reveal for the current browser session;
- MCP configuration generation.

Protected requests use:

```http
X-Admin-Key: <DEMO_ADMIN_KEY>
```

### Reset demo

Reset removes live and seeded demo data, recreates the event and participant records, and starts a new open demo session. It is available only when `DEMO_MODE=true`.

From the dashboard, use **Reset**. Scripted example:

```bash
curl -X POST http://localhost:4000/api/admin/demo/reset \
  -H "x-admin-key: $DEMO_ADMIN_KEY"
```

### Seed historical activity

Seeded activity is stored in a closed session. It remains visible in organizer metrics while live participant quotas stay clean.

```bash
curl -X POST http://localhost:4000/api/admin/demo/seed \
  -H "x-admin-key: $DEMO_ADMIN_KEY"
```

The operation is idempotent for the existing seeded session.

## Logs

```bash
```

For a premium failure, inspect API and provider logs together. The API owns policy and payment orchestration; the provider owns the x402 resource server.

## PostgreSQL inspection

Connect to the local database:

```bash
```

Useful read-only queries:

```sql
SELECT id, name, status, total_budget, spent_budget, reserved_budget
FROM events;

SELECT id, name, status, allocated_budget, spent_budget, reserved_budget, daily_limit
FROM participants;

SELECT tool_name, status, price, transaction_id, x402_state, created_at
FROM usage_records
ORDER BY created_at DESC
LIMIT 30;
```

Do not manually delete `PENDING` rows during an active request. The recovery process releases stale reservations after `USAGE_RESERVATION_TIMEOUT_MS`.

## Data lifecycle

| Operation | Effect |
| --- | --- |
| API startup | Applies schema, synchronizes the aggregate participant daily limit, then bootstraps the event if needed |
| Demo reset | Deletes demo sessions, usage records, participants, tools, and events, then recreates the current demo |
| Seed activity | Adds a closed historical session without consuming live participant quotas |
| Container restart | Preserves PostgreSQL data because of the `postgres_data` volume |
| `docker compose down -v` | Deletes the local PostgreSQL volume and all local data |

## Backups and production caution

The Compose setup is a local/demo environment. It does not configure PostgreSQL backups, TLS termination, secret rotation, rate limiting, or external log retention. Add those controls before using the service for a real event.

## Release checklist

- [ ] Run unit tests and typechecks.
- [ ] Run a production build.
- [ ] Run `docker compose config --quiet`.
- [ ] Verify all healthchecks.
- [ ] Confirm `DEMO_MODE` matches the intended environment.
- [ ] Confirm no real private key appears in provider or web environment.
- [ ] Verify a controlled premium flow and ledger state.
- [ ] Inspect the diff before committing.

## Related documents

- [Getting started](GETTING_STARTED.md)
- [Testing](TESTING.md)
- [Security](SECURITY.md)
