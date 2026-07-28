import test from "node:test";
import assert from "node:assert/strict";
import { deriveDashboardMetrics } from "./service.js";
test("dashboard metrics distinguish settled, failed, and policy rejected activity", () => {
  const metrics = deriveDashboardMetrics(
    [
      {
        tool_name: "validate_project_strategy",
        price: 0.01,
        status: "SETTLED",
        participant_id: "a",
      },
      {
        tool_name: "audit_submission",
        price: 0.05,
        status: "FAILED",
        participant_id: "a",
      },
      {
        tool_name: "audit_submission",
        price: 0,
        status: "REJECTED",
        participant_id: "b",
      },
    ],
    0.01,
    2,
  );
  assert.equal(metrics.failedPayments, 1);
  assert.equal(metrics.policyRejections, 1);
  assert.equal(metrics.averageCostPerParticipant, 0.01);
  assert.equal(
    metrics.usageByTool.find((x) => x.tool === "validate_project_strategy")
      ?.calls,
    1,
  );
});
