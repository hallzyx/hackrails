import { createHash } from "node:crypto";
import { pool } from "./db.js";

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function participantDashboard(token: string) {
  const participant = (await pool.query(`
    SELECT p.id, p.name, p.external_id, p.status, p.allocated_budget,
           p.spent_budget, p.daily_limit, p.event_id, e.name AS event_name,
           e.status AS event_status
    FROM participants p
    JOIN events e ON e.id = p.event_id
    WHERE p.token_hash = $1
  `, [hashToken(token)])).rows[0];

  if (!participant) return null;

  const [toolsResult, usageResult] = await Promise.all([
    pool.query("SELECT name, description, type, price, max_calls, enabled FROM tools WHERE enabled=true ORDER BY name"),
    pool.query(`
      SELECT tool_name, COUNT(*) FILTER (WHERE status IN ('PENDING', 'SETTLED'))::int AS calls,
             COUNT(*) FILTER (WHERE status = 'SETTLED')::int AS settled_calls
      FROM usage_records
      WHERE participant_id = $1 AND demo_session_id = (SELECT demo_session_id FROM participants WHERE id = $1)
      GROUP BY tool_name
    `, [participant.id]),
  ]);

  const usageByTool = new Map(usageResult.rows.map((row) => [row.tool_name, row]));
  const tools = toolsResult.rows.map((tool) => {
    const usage = usageByTool.get(tool.name);
    return {
      name: tool.name,
      description: tool.description,
      type: tool.type,
      price: Number(tool.price),
      maxCalls: tool.max_calls,
      callsUsed: usage?.calls ?? 0,
      settledCalls: usage?.settled_calls ?? 0,
    };
  });

  return {
    team: {
      id: participant.id,
      name: participant.name,
      externalId: participant.external_id,
      status: participant.status,
      eventId: participant.event_id,
      eventName: participant.event_name,
      eventStatus: participant.event_status,
    },
    budget: {
      allocated: Number(participant.allocated_budget),
      spent: Number(participant.spent_budget),
      remaining: Number((Number(participant.allocated_budget) - Number(participant.spent_budget)).toFixed(6)),
      dailyLimit: Number(participant.daily_limit),
    },
    tools,
    skill: {
      name: "hackrails-skill",
      version: "2.0.0",
      downloadPath: "/api/hackrails-skill/download",
    },
  };
}
