CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL, total_budget NUMERIC NOT NULL,
  spent_budget NUMERIC NOT NULL DEFAULT 0, reserved_budget NUMERIC NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'USDC',
  organizer_account_id TEXT, recipient_account_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS demo_sessions (
  id TEXT PRIMARY KEY, event_id TEXT REFERENCES events(id), status TEXT NOT NULL, seeded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), closed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY, event_id TEXT REFERENCES events(id), demo_session_id TEXT REFERENCES demo_sessions(id),
  name TEXT NOT NULL, external_id TEXT NOT NULL, token_hash TEXT NOT NULL, allocated_budget NUMERIC NOT NULL,
  spent_budget NUMERIC NOT NULL DEFAULT 0, reserved_budget NUMERIC NOT NULL DEFAULT 0, daily_limit NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tools (
  name TEXT PRIMARY KEY, description TEXT NOT NULL, type TEXT NOT NULL, price NUMERIC NOT NULL DEFAULT 0,
  max_calls INTEGER NOT NULL, enabled BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS usage_records (
  id TEXT PRIMARY KEY, event_id TEXT REFERENCES events(id), demo_session_id TEXT REFERENCES demo_sessions(id),
  participant_id TEXT REFERENCES participants(id), tool_name TEXT REFERENCES tools(name), idempotency_key TEXT NOT NULL,
  price NUMERIC NOT NULL, status TEXT NOT NULL, transaction_id TEXT, hashscan_url TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}', result_payload JSONB, error_code TEXT, seeded BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), settled_at TIMESTAMPTZ,
  settlement_mode TEXT, x402_state TEXT, payment_required JSONB, payment_response JSONB
  , payment_payload_hash TEXT, facilitator_receipt JSONB
);
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS settlement_mode TEXT;
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS x402_state TEXT;
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS payment_required JSONB;
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS payment_response JSONB;
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS payment_payload_hash TEXT;
ALTER TABLE usage_records ADD COLUMN IF NOT EXISTS facilitator_receipt JSONB;
ALTER TABLE usage_records DROP CONSTRAINT IF EXISTS usage_records_idempotency_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS usage_participant_tool_idempotency_key ON usage_records(participant_id, tool_name, idempotency_key);
CREATE INDEX IF NOT EXISTS usage_event_created ON usage_records(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS usage_quota_reservation ON usage_records(participant_id, demo_session_id, tool_name, status, created_at);
