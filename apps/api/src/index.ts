import "dotenv/config";
import express from "express";
import cors from "cors";
import { ZipArchive } from "archiver";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { migrate } from "./db.js";
import {
  bootstrapLive,
  dashboard,
  invokeTool,
  resetDemo,
  seedDemo,
  syncParticipantDailyLimit,
  updateEvent,
  updateParticipant,
  resetParticipant,
  revealParticipantToken,
} from "./service.js";
import { participantDashboard } from "./participant.js";
import { isAdmin } from "./auth.js";
import { toolSchemas } from "./input.js";
const app = express();
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
    methods: ["GET", "POST"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "X-Admin-Key",
    ],
  }),
);
app.use(express.json({ limit: "100kb" }));
const admin = (
  q: express.Request,
  r: express.Response,
  next: express.NextFunction,
) =>
  isAdmin(q) ? next() : r.status(401).json({ error: "Admin key required." });
const eventId = z.object({ eventId: z.literal("hedera-x402-demo") });
const call = z.object({
  tool: z.enum([
    "get_event_guidance",
    "validate_project_strategy",
    "audit_submission",
  ]),
  payload: z.record(z.unknown()).default({}),
  idempotencyKey: z.string().min(1).max(128).optional(),
});
app.get("/health", (_q, r) =>
  r.json({
    ok: true,
    service: "hackrails-api",
    demoMode: process.env.DEMO_MODE === "true",
  }),
);
app.get("/api/hackrails-skill/download", (_q, r, n) => {
  const directory = skillDirectory();
  if (!directory)
    return r
      .status(404)
      .json({ error: "HackRails skill package unavailable." });
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", n);
  r.attachment("hackrails-skill.zip");
  archive.pipe(r);
  archive.directory(directory, "hackrails-skill");
  void archive.finalize();
});
app.get("/api/participant/dashboard", async (q, r, n) => {
  try {
    const auth = q.header("authorization");
    if (!auth?.startsWith("Bearer "))
      return r.status(401).json({ error: "Bearer token required" });
    const data = await participantDashboard(auth.slice(7).trim());
    if (!data)
      return r.status(401).json({ error: "Invalid participant token" });
    r.json(data);
  } catch (e) {
    n(e);
  }
});
app.get("/api/events/:eventId/dashboard", async (q, r, n) => {
  try {
    eventId.parse(q.params);
    const d = await dashboard(String(q.params.eventId));
    if (!d) return r.status(404).json({ error: "Event missing. Run seed." });
    r.json(d);
  } catch (e) {
    n(e);
  }
});
app.get("/api/events/:eventId", async (q, r, n) => {
  try {
    eventId.parse(q.params);
    r.json((await dashboard(String(q.params.eventId)))?.event);
  } catch (e) {
    n(e);
  }
});
for (const [path, status] of [
  ["activate", "ACTIVE"],
  ["pause", "PAUSED"],
  ["resume", "ACTIVE"],
] as const)
  app.post(`/api/events/:eventId/${path}`, admin, async (q, r, n) => {
    try {
      eventId.parse(q.params);
      r.json(await updateEvent(String(q.params.eventId), status));
    } catch (e) {
      n(e);
    }
  });
app.post("/api/participants/:id/:action", admin, async (q, r, n) => {
  try {
    const e = eventId.parse({ eventId: q.query.eventId ?? "hedera-x402-demo" });
    if (q.params.action === "reset-demo-usage")
      r.json(await resetParticipant(e.eventId, String(q.params.id)));
    else if (["pause", "resume"].includes(String(q.params.action)))
      r.json(
        await updateParticipant(
          e.eventId,
          String(q.params.id),
          String(q.params.action) === "pause" ? "PAUSED" : "ACTIVE",
        ),
      );
    else r.status(404).json({ error: "Unknown action" });
  } catch (e) {
    n(e);
  }
});
app.get(
  "/api/events/:eventId/participants/:id/token",
  admin,
  async (q, r, n) => {
    try {
      eventId.parse(q.params);
      r.json(
        await revealParticipantToken(
          String(q.params.eventId),
          String(q.params.id),
        ),
      );
    } catch (e) {
      n(e);
    }
  },
);
app.post("/api/admin/demo/reset", admin, async (_q, r, n) => {
  try {
    const result = await resetDemo();
    await syncParticipantDailyLimit();
    r.json(result);
  } catch (e) {
    n(e);
  }
});
app.post("/api/admin/demo/seed", admin, async (_q, r, n) => {
  try {
    r.json(await seedDemo());
  } catch (e) {
    n(e);
  }
});
app.post("/internal/mcp/call", async (q, r, n) => {
  try {
    const parsed = call.parse(q.body),
      payload = toolSchemas[parsed.tool].parse(parsed.payload);
    const auth = q.header("authorization");
    if (!auth?.startsWith("Bearer "))
      return r.status(401).json({ error: "Bearer token required" });
    r.json(
      await invokeTool({
        token: auth.slice(7),
        tool: parsed.tool,
        payload,
        idempotencyKey: q.header("idempotency-key") ?? parsed.idempotencyKey,
      }),
    );
  } catch (e) {
    n(e);
  }
});
app.use(
  (
    err: unknown,
    _q: express.Request,
    r: express.Response,
    _n: express.NextFunction,
  ) => {
    const e = err as { message?: string; status?: number; issues?: unknown };
    r.status(e.status ?? 400).json({
      error: e.message ?? "Request failed",
      code: e.issues ? "INVALID_ARGUMENT" : undefined,
      details: e.issues,
    });
  },
);
const skillDirectory = () =>
  [
    join(process.cwd(), "packages/hackrails-skill"),
    join(process.cwd(), "../../packages/hackrails-skill"),
  ].find(existsSync);
const port = Number(process.env.PORT ?? 4000);
if (
  process.env.DEMO_MODE !== "true" &&
  !process.env.HEDERA_RECIPIENT_ACCOUNT_ID
)
  throw new Error(
    "HEDERA_RECIPIENT_ACCOUNT_ID is required when DEMO_MODE is not true.",
  );
migrate()
  .then(async () => {
    await syncParticipantDailyLimit();
    if (!(await dashboard())) {
      if (process.env.DEMO_MODE === "true") {
        await resetDemo();
        await syncParticipantDailyLimit();
      } else await bootstrapLive();
    }
    app.listen(port, () => console.log(`HackRails API listening on ${port}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
export { toolSchemas };
