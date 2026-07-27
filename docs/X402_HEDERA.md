# x402 and Hedera Settlement

This document explains the live premium payment path. Read it before setting `DEMO_MODE=false`.

## Quick path

1. Configure a Hedera Testnet buyer account, private key, recipient, asset, and facilitator.
2. Keep the private key in the API environment only.
3. Start the provider and API.
4. Confirm `/health` reports the expected network and mode.
5. Run a single controlled premium call and verify the HashScan transaction.

## Roles

| Role | Service | Responsibility |
| --- | --- | --- |
| Resource server | Provider | Advertises the price and x402 payment requirement |
| Buyer/sponsor | API | Creates the payment, signs it, and retries the request |
| Facilitator | External x402 service | Processes and reports settlement |
| Ledger | PostgreSQL | Stores reservation, payment metadata, result, and state |
| Settlement network | Hedera Testnet | Records the HTS USDC transfer |

The participant is not a payer and does not need a wallet.

## Required configuration

```dotenv
DEMO_MODE=false
X402_FACILITATOR_URL=https://api.testnet.blocky402.com
HEDERA_NETWORK=hedera:testnet
HEDERA_USDC_TOKEN_ID=0.0.429274
HEDERA_ACCOUNT_ID=0.0.organizer
HEDERA_PRIVATE_KEY=private-key
HEDERA_RECIPIENT_ACCOUNT_ID=0.0.provider
```

The exact asset and recipient must match the provider's payment requirement. A missing recipient or buyer key stops live payment setup.

## HTTP-visible flow

### First request

The API calls:

```http
POST /tools/validate_project_strategy
```

without a payment signature. The provider responds with the canonical x402 `PAYMENT-REQUIRED` challenge.

### Requirement validation

The API validates:

- `scheme=exact`;
- the configured Hedera network;
- the configured USDC asset;
- the configured recipient account;
- the exact tool amount.

Amounts use the asset's six-decimal smallest unit:

| Tool | Display price | x402 amount |
| --- | ---: | ---: |
| `validate_project_strategy` | `0.01 USDC` | `10000` |
| `audit_submission` | `0.05 USDC` | `50000` |

If the provider advertises a mismatched amount, the API aborts before signing.

### Payment retry and settlement

The API creates the canonical Hedera exact payment, sends the payment headers on the retry, then checks the facilitator's `PAYMENT-RESPONSE`. A premium usage becomes `SETTLED` only after successful settlement is reported.

The ledger stores:

- payment payload hash;
- payment required payload;
- payment response;
- facilitator receipt;
- transaction ID;
- HashScan URL;
- x402 state;
- result payload.

## Demo mode versus live mode

| Mode | Blockchain transaction | Provider path | Intended use |
| --- | ---: | --- | --- |
| `DEMO_MODE=true` | No | Deterministic local receipt | Local development and demos |
| `DEMO_MODE=false` | Yes | Canonical x402 facilitator flow | Hedera Testnet integration |

Demo receipts are deliberately labeled with `DEMO_MODE`. They must not be presented as on-chain proof.

## Failure behavior

If the provider, facilitator, network, or validation step fails:

1. The usage row becomes `FAILED`.
2. Participant and event reservations are released.
3. No successful settlement is reported.
4. The API returns `Settlement or premium provider flow failed; reservation released.`

Policy rejection happens earlier and creates a zero-price `REJECTED` row. It does not execute payment.

## Security rules

- Never put `HEDERA_PRIVATE_KEY` in the provider container.
- Never put the organizer key in the browser or MCP configuration.
- Never use a participant token as a payment credential.
- Treat HashScan links as evidence only after checking network and transaction status.
- Use a dedicated funded Testnet account for demonstrations.

## Troubleshooting

### `HEDERA_RECIPIENT_ACCOUNT_ID is required`

Set the recipient account and restart the API/provider.

### Payment requirement mismatch

Check that API and provider use the same:

- `HEDERA_NETWORK`;
- `HEDERA_USDC_TOKEN_ID`;
- `HEDERA_RECIPIENT_ACCOUNT_ID`;
- per-tool smallest-unit amount.

### Facilitator failure

Inspect API and provider logs together:

```bash
docker compose logs -f api provider
```

## Related documents

- [Architecture](ARCHITECTURE.md)
- [Configuration](CONFIGURATION.md)
- [Operations](OPERATIONS.md)
