import express from "express";
import { toolCatalog } from "./schemas.js";
import { handleMcpRequest } from "./transport.js";

function requireBearerForToolCalls(request: express.Request, response: express.Response, next: express.NextFunction) {
  if (request.body?.method !== "tools/call" || request.header("authorization")?.startsWith("Bearer ")) {
    next();
    return;
  }

  const id = typeof request.body?.id === "string" || typeof request.body?.id === "number" ? request.body.id : null;
  response.status(401).json({
    jsonrpc: "2.0",
    id,
    error: { code: -32602, message: "Authorization bearer token required" },
  });
}

export function createHttpServer() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    response.json({ ok: true, service: "hackrails-mcp", tools: toolCatalog.map((tool) => tool.name) });
  });

  app.post("/mcp", requireBearerForToolCalls, handleMcpRequest);
  return app;
}