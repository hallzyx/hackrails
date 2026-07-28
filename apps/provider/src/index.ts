import "dotenv/config";
import { serve } from "@hono/node-server";
import {
  HTTPFacilitatorClient,
  x402ResourceServer,
  type RoutesConfig,
} from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactHederaScheme } from "@x402/hedera/exact/server";
import { paymentMiddleware } from "@x402/hono";
import { cors } from "hono/cors";
import { Hono } from "hono";

const prices: Record<string, string> = {
  validate_project_strategy: "10000",
  audit_submission: "50000",
};
const network = () => process.env.HEDERA_NETWORK ?? "hedera:testnet";
const asset = () => process.env.HEDERA_USDC_TOKEN_ID ?? "0.0.429274";
const payTo = () => {
  const value = process.env.HEDERA_RECIPIENT_ACCOUNT_ID;
  if (!value && process.env.DEMO_MODE !== "true")
    throw new Error(
      "HEDERA_RECIPIENT_ACCOUNT_ID is required when DEMO_MODE is not true.",
    );
  return value ?? "demo-recipient";
};
const facilitatorUrl = () =>
  process.env.X402_FACILITATOR_URL ?? "https://api.testnet.blocky402.com";

import { validateProjectStrategy, auditSubmission } from "@hackrails/shared";

async function result(tool: string, payload: Record<string, unknown>) {
  if (tool === "validate_project_strategy")
    return {
      tool,
      kind: "strategy_validation",
      ...(await validateProjectStrategy(
        payload as unknown as Parameters<typeof validateProjectStrategy>[0],
      )),
      payload,
    };
  return {
    tool,
    kind: "submission_audit",
    ...(await auditSubmission(
      payload as unknown as Parameters<typeof auditSubmission>[0],
    )),
    payload,
  };
}

function routes(): RoutesConfig {
  return {
    "POST /tools/:tool": {
      description: "HackRails organizer-sponsored premium analysis",
      mimeType: "application/json",
      accepts: {
        scheme: "exact",
        network: network() as Network,
        payTo: payTo(),
        price: (context) => {
          const tool = context.path.split("/").pop() ?? "";
          const amount = prices[tool];
          if (!amount) throw new Error("Unknown premium tool.");
          return { amount, asset: asset() };
        },
        maxTimeoutSeconds: 300,
      },
    },
  };
}

export function createProvider() {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
      allowHeaders: ["Content-Type", "PAYMENT-SIGNATURE", "Idempotency-Key"],
      exposeHeaders: ["PAYMENT-REQUIRED", "PAYMENT-RESPONSE"],
      allowMethods: ["POST", "OPTIONS"],
    }),
  );
  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "hackrails-provider",
      scheme: "exact",
      network: network(),
      facilitatorUrl: facilitatorUrl(),
      demoMode: process.env.DEMO_MODE === "true",
    }),
  );
  app.use("/tools/:tool", async (c, next) => {
    if (!(c.req.param("tool") in prices))
      return c.json({ error: "Unknown premium tool." }, 404);
    await next();
  });
  const resourceServer = new x402ResourceServer(
    new HTTPFacilitatorClient({ url: facilitatorUrl() }),
  ).register(
    "hedera:*",
    new ExactHederaScheme({
      defaultAssets: { [network()]: { asset: asset(), decimals: 6 } },
    }),
  );
  let initialization: Promise<void> | undefined;
  app.use("/tools/:tool", async (_c, next) => {
    initialization ??= resourceServer.initialize();
    await initialization;
    await next();
  });
  app.use(
    "*",
    paymentMiddleware(routes(), resourceServer, undefined, undefined, false),
  );
  app.post("/tools/:tool", async (c) =>
    c.json(
      await result(
        c.req.param("tool"),
        await c.req.json<Record<string, unknown>>(),
      ),
    ),
  );
  return app;
}

if (process.env.NODE_ENV !== "test")
  serve(
    { fetch: createProvider().fetch, port: Number(process.env.PORT ?? 4002) },
    (info) => console.log(`HackRails provider listening on ${info.port}`),
  );
