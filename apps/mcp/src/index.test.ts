import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { argumentsSchemas, toolCatalog } from "./schemas.js";
import { createHttpServer } from "./server.js";

test("each MCP tool rejects invalid arguments", () => {
  assert.equal(argumentsSchemas.get_event_guidance.safeParse({}).success, false);
  assert.equal(argumentsSchemas.validate_project_strategy.safeParse({ idea: "x", extra: true }).success, false);
  assert.equal(argumentsSchemas.audit_submission.safeParse({ repositoryUrl: "not-a-url", summary: "x" }).success, false);
});

test("event guidance discovery describes the official-event-only scope", () => {
  const guidance = toolCatalog.find((tool) => tool.name === "get_event_guidance");
  assert.ok(guidance);
  assert.match(guidance.description, /official event rules, dates, eligibility, prizes, x402\/Hedera requirements, and submission requirements/i);
  assert.match(guidance.description, /does not validate project strategy/i);
});

test("serves the Streamable HTTP MCP lifecycle", async (t) => {
  const httpServer = createServer(createHttpServer());
  httpServer.listen(0);
  await once(httpServer, "listening");
  t.after(() => httpServer.close());

  const address = httpServer.address();
  assert.ok(address && typeof address !== "string");
  const endpoint = `http://127.0.0.1:${address.port}/mcp`;
  const headers = {
    accept: "application/json, text/event-stream",
    "content-type": "application/json",
  };

  const post = (body: object) => fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const initialize = await post({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  });
  assert.equal(initialize.status, 200);
  assert.match(await initialize.text(), /hackrails-mcp/);

  const initialized = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(initialized.status, 202);

  const toolsList = await post({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  const toolsListBody = await toolsList.text();
  assert.equal(toolsList.status, 200);
  assert.match(toolsListBody, /get_event_guidance/);
  assert.match(toolsListBody, /validate_project_strategy/);
  assert.match(toolsListBody, /audit_submission/);
});