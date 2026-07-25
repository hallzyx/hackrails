import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import type { ToolName } from "./schemas.js";

type ApiFailure = { error?: string; details?: unknown };

export class McpApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export async function callMcpApi(tool: ToolName, payload: unknown, authorization: string, idempotencyKey?: string) {
  const response = await fetch(`${config.apiUrl}/internal/mcp/call`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization,
      "idempotency-key": idempotencyKey ?? randomUUID(),
    },
    body: JSON.stringify({ tool, payload }),
  });

  const body = await response.json() as ApiFailure;
  if (!response.ok) {
    throw new McpApiError(body.error ?? "Tool request rejected", response.status, body.details);
  }

  return body;
}