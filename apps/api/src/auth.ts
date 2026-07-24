import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
export function isAdmin(req: Pick<Request, "header">) { const key = process.env.DEMO_ADMIN_KEY; if (!key) return false; const presented = req.header("x-admin-key") ?? req.header("authorization")?.replace(/^Bearer\s+/i, ""); if (!presented) return false; const a = Buffer.from(key), b = Buffer.from(presented); return a.length === b.length && timingSafeEqual(a, b); }
