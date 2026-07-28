# Configuration

HackRails uses one root `.env` file for local development and Docker Compose interpolation. Copy `.env.example` to `.env` and keep secrets out of source control.

## Settlement configuration

Real Hedera Testnet settlement is the default runtime behavior:

```dotenv
DEMO_MODE=false
HEDERA_ACCOUNT_ID=0.0.x
HEDERA_PRIVATE_KEY=your-hedera-private-key
HEDERA_RECIPIENT_ACCOUNT_ID=0.0.y
```

Premium calls require a funded Hedera account, a valid facilitator, and a reachable provider. The private key is consumed only by the API process.

Set `DEMO_MODE=true` only for isolated UI or non-payment tests where no blockchain transaction should be created. This is not the standard application mode.

## Environment variables

| Variable | Required | Default | Used by | Notes |
| --- | ---: | --- | --- | --- |
| `DATABASE_URL` | Local | `postgresql://hackrails:hackrails@localhost:5432/hackrails` | API | PostgreSQL connection string |
| `DEMO_MODE` | No | `false` | API/provider | Set `true` only for isolated non-payment testing |
| `DEMO_ADMIN_KEY` | Yes for admin actions | — | API | Local admin control key; never use a shared production secret |
| `USAGE_RESERVATION_TIMEOUT_MS` | No | `300000` | API | Stale `PENDING` reservation timeout |
| `CORS_ORIGIN` | No | `http://localhost:3000` | API/provider | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000` | Web build/runtime | Browser-visible API URL |
| `PREMIUM_SERVICE_URL` | No | `http://localhost:4002` | API | Internal provider URL |
| `X402_FACILITATOR_URL` | No | `https://api.testnet.blocky402.com` | API/provider | x402 facilitator endpoint |
| `HEDERA_NETWORK` | No | `hedera:testnet` | API/provider | Current supported target |
| `HEDERA_USDC_TOKEN_ID` | No | `0.0.429274` | API/provider | Testnet USDC HTS asset with 6 decimals |
| `HEDERA_ACCOUNT_ID` | Live | — | API | Organizer buyer/sponsor account |
| `HEDERA_PRIVATE_KEY` | Live | — | API | Organizer signing key; keep API-only |
| `HEDERA_RECIPIENT_ACCOUNT_ID` | Live | — | API/provider | Provider recipient account |

## Service-specific configuration

### API

The API requires:

- `DATABASE_URL`;
- `DEMO_ADMIN_KEY` for protected admin endpoints;
- all live Hedera buyer variables;
- `PREMIUM_SERVICE_URL` to reach the provider.

### Provider

The provider requires:

- `HEDERA_NETWORK`;
- `HEDERA_USDC_TOKEN_ID`;
- `HEDERA_RECIPIENT_ACCOUNT_ID` in live mode;
- `X402_FACILITATOR_URL`.

The provider does not require `HEDERA_PRIVATE_KEY`.

### MCP

The MCP server uses:

```dotenv
PORT=4001
API_URL=http://localhost:4000
```

Inside Docker, the API URL is `http://api:4000`.

### Web

The web app uses:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The browser must be able to resolve this URL. Docker service names such as `http://api:4000` are not valid browser URLs when the browser runs on the host.

## Tool policy configuration

The current premium catalog is:

| Tool | Type | Price | Maximum calls/team |
| --- | --- | ---: | ---: |
| `get_event_guidance` | Free | `0` | Unlimited in the current catalog |
| `validate_project_strategy` | Premium | `0.01 USDC` | `3` |
| `audit_submission` | Premium | `0.05 USDC` | `2` |

The aggregate participant daily sponsorship cap is:

```text
3 × 0.01 + 2 × 0.05 = 0.13 USDC
```

Tool editing is not yet exposed in the admin dashboard. Prices are currently duplicated in the API and provider catalogs; update both sides together if changing them manually. See [Architecture](ARCHITECTURE.md#current-configuration-caveat).

## Secret handling checklist

- [ ] `.env` is ignored by Git.
- [ ] Private keys are present only in the API environment.
- [ ] The provider has no `HEDERA_PRIVATE_KEY`.
- [ ] `DEMO_MODE=false` is used with a deliberately funded Testnet account.
- [ ] `DEMO_ADMIN_KEY` is not reused outside local development.
- [ ] Logs and screenshots do not contain bearer tokens or private keys.

## Next step

Read [x402 and Hedera](X402_HEDERA.md) before enabling live settlement.
