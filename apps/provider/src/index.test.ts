import test from "node:test";
import assert from "node:assert/strict";
process.env.NODE_ENV = "test";
process.env.HEDERA_RECIPIENT_ACCOUNT_ID = "0.0.7";
const { createProvider } = await import("./index.js");

test("provider exposes a canonical x402 v2 payment challenge without a provider key", async () => {
  delete process.env.HEDERA_PRIVATE_KEY;
  const response = await createProvider().request("http://localhost/tools/validate_project_strategy", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idea: "test" }) });
  assert.equal(response.status, 402);
  const challenge = response.headers.get("PAYMENT-REQUIRED");
  assert.ok(challenge);
  const decoded = JSON.parse(Buffer.from(challenge, "base64").toString("utf8"));
  assert.equal(decoded.x402Version, 2);
  assert.equal(decoded.accepts[0].scheme, "exact");
  assert.equal(decoded.accepts[0].network, "hedera:testnet");
  assert.equal(decoded.accepts[0].asset, "0.0.429274");
});


test("provider fails closed without a recipient outside demo mode", () => {
  const previousDemoMode = process.env.DEMO_MODE;
  const previousRecipient = process.env.HEDERA_RECIPIENT_ACCOUNT_ID;
  delete process.env.DEMO_MODE;
  delete process.env.HEDERA_RECIPIENT_ACCOUNT_ID;
  try {
    assert.throws(() => createProvider(), /HEDERA_RECIPIENT_ACCOUNT_ID/);
  } finally {
    if (previousDemoMode === undefined) delete process.env.DEMO_MODE; else process.env.DEMO_MODE = previousDemoMode;
    if (previousRecipient === undefined) delete process.env.HEDERA_RECIPIENT_ACCOUNT_ID; else process.env.HEDERA_RECIPIENT_ACCOUNT_ID = previousRecipient;
  }
});
