import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";
import { callMcpApi, McpApiError } from "./api-client.js";
import { argumentsSchemas } from "./schemas.js";
import type { ToolName } from "./schemas.js";

type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

function header(headers: Record<string, string | string[] | undefined>, name: string) {
  const value = headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function toolResult(body: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(body, null, 2) }],
    structuredContent: body as Record<string, unknown>,
  };
}

function toolError(error: unknown): CallToolResult {
  if (error instanceof McpApiError) {
    return {
      content: [{ type: "text", text: error.message }],
      isError: true,
      structuredContent: { error: error.message, details: error.details, status: error.status },
    };
  }

  return {
    content: [{ type: "text", text: (error as Error).message }],
    isError: true,
  };
}

async function invokeTool(tool: ToolName, args: unknown, extra: ToolExtra): Promise<CallToolResult> {
  const headers = extra.requestInfo?.headers ?? {};
  const authorization = header(headers, "authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      content: [{ type: "text", text: "Authorization bearer token required" }],
      isError: true,
    };
  }

  try {
    const idempotencyKey = header(headers, "x-idempotency-key") ?? header(headers, "idempotency-key");
    return toolResult(await callMcpApi(tool, args, authorization, idempotencyKey));
  } catch (error) {
    return toolError(error);
  }
}

export function createMcpServer() {
  const server = new McpServer({ name: "hackrails-mcp", version: "0.1.0" });

  server.registerTool("get_event_guidance", {
    description: "Read official organizer-backed guidance, tracks, deliverables and sponsor criteria.",
    inputSchema: argumentsSchemas.get_event_guidance,
  }, (args, extra) => invokeTool("get_event_guidance", args, extra));

  server.registerTool("validate_project_strategy", {
    description: "Use premium organizer intelligence to validate a project strategy against official rules, judging criteria, sponsor objectives, previous projects, and rejection patterns. Returns strategic fit scores, risks, historical overlap, and prioritized actions.",
    inputSchema: argumentsSchemas.validate_project_strategy,
  }, (args, extra) => invokeTool("validate_project_strategy", args, extra));

  server.registerTool("audit_submission", {
    description: "Run a premium audit for submission readiness, checking repository, x402 flow evidence, on-chain proof, and in-scope organizer checklist items. Video review is outside this tool's scope. Returns readiness score, findings, and fix-first plan.",
    inputSchema: argumentsSchemas.audit_submission,
  }, (args, extra) => invokeTool("audit_submission", args, extra));

  return server;
}
