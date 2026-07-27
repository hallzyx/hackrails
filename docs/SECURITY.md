# Security Model

HackRails separates participant access, organizer control, payment signing, and premium execution. This document describes the current MVP posture and the boundaries that must remain intact.

## Security principles

1. Participants never handle organizer wallets.
2. The browser never receives Hedera private keys.
3. The provider never receives the organizer private key.
4. The API is the only policy and payment authority.
5. Failed or rejected work must not silently consume sponsored capacity.
6. Payment requirements must be validated before signing.

## Credential boundaries

| Credential | Allowed location | Never expose to |
| --- | --- | --- |
| `HEDERA_PRIVATE_KEY` | API server environment | Browser, MCP, provider, participant |
| `DEMO_ADMIN_KEY` | Local admin operator and API environment | Participant clients |
| Participant token | Participant dashboard/MCP client | Other teams or logs |
| `DATABASE_URL` | API and local operations | Browser or provider response |

## Participant authentication

- Participant tokens are hashed before lookup.
- MCP requires `Authorization: Bearer` for `tools/call`.
- The API validates the token against the participant record.
- The participant dashboard stores the token in browser `sessionStorage` for the current session.
- Invalid dashboard authentication clears the local session.

The current `sessionStorage` approach is suitable for the MVP but should be reviewed before a high-value production event. A production deployment should consider short-lived tokens, rotation, revocation, and stronger browser storage controls.

## Admin authorization

Admin endpoints require `X-Admin-Key`. The current implementation uses one shared configured key and is intended for the local demo.

Before production, replace this with:

- individual organizer identities;
- role-based authorization;
- key rotation and revocation;
- audit logs for administrative actions;
- rate limiting and brute-force protection.

## Payment safety

Before the API signs a payment, it checks:

- exact payment scheme;
- Hedera network;
- USDC asset;
- provider recipient;
- exact tool amount.

The API also records a payment payload hash and settlement receipt. An x402 response is not considered successful until the facilitator confirms settlement.

## Input and execution safety

- API tool payloads are validated with Zod schemas.
- Premium validators operate on organizer-provided knowledge and submitted project evidence.
- Repository inspection is limited to the submission audit flow.
- No private repository credential is accepted by the current tool contract.
- Tool calls use idempotency keys to avoid duplicate settlement.
- Provider requests have a timeout and failed reservations are released.

## Data exposure

The participant dashboard is intentionally narrower than the admin dashboard. Participants receive:

- their team identity and event status;
- tool availability and usage counters;
- participant resource links.

The admin dashboard receives:

- aggregate event budget and consumption;
- participant quota ledger;
- transaction history and settlement metadata;
- impact and failure metrics.

Do not add organizer-only data to the participant endpoint without reviewing the trust boundary.

## Deployment checklist

- [ ] Use HTTPS for browser, MCP, API, and provider traffic.
- [ ] Restrict PostgreSQL network access.
- [ ] Store secrets in a secret manager.
- [ ] Rotate organizer and admin credentials.
- [ ] Add rate limits to MCP, API, and admin endpoints.
- [ ] Add structured audit logging without bearer tokens or private keys.
- [ ] Configure backups and restore drills.
- [ ] Pin and review dependency updates.
- [ ] Use a dedicated Hedera Testnet account for staging.
- [ ] Confirm provider has no private-key environment variable.

## Related documents

- [Architecture](ARCHITECTURE.md)
- [Configuration](CONFIGURATION.md)
- [x402 and Hedera](X402_HEDERA.md)
