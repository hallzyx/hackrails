import test from "node:test";
import assert from "node:assert/strict";
import { createTimeoutFetch, demoPremiumResult, validatePaymentRequirements } from "./x402.js";

process.env.HEDERA_RECIPIENT_ACCOUNT_ID = "0.0.7";

test("demo mode retains a ledger receipt while running the real strategy analysis", async () => {
  const result = await demoPremiumResult("validate_project_strategy", {
    event_id: "hedera-x402-demo",
    project_name: "Test Project",
    project_summary: "An x402 payment project on Hedera.",
    problem: "Agents need programmatic payments.",
    target_users: "AI agents",
    selected_track: "Hedera x402 Bounty",
    planned_integrations: ["x402", "Hedera"],
    current_stage: "MVP",
  }, "idem-123");
  assert.equal(result.x402State, "PAYMENT_RESPONSE_RECORDED");
  assert.match(result.transactionId ?? "", /^demo-x402-/);
  assert.equal(result.paymentPayloadHash.length, 64);
});

test("pins the Hedera network, USDC asset, recipient, and exact per-tool amount before payment", () => {
  validatePaymentRequirements({ accepts: [{ scheme: "exact", network: "hedera:testnet", asset: "0.0.429274", payTo: "0.0.7", amount: "10000" }] }, "validate_project_strategy");
  assert.throws(() => validatePaymentRequirements({ accepts: [{ scheme: "exact", network: "hedera:testnet", asset: "0.0.429274", payTo: "0.0.7", amount: "50000" }] }, "validate_project_strategy"));
});

test("provider fetch timeout aborts the x402 request", async () => {
  const timeoutFetch = createTimeoutFetch((async (_input, init) => await new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true }))) as typeof fetch, 5);
  await assert.rejects(timeoutFetch("http://provider.test"), /aborted/);
});
