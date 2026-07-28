import { Pool, PoolClient } from "pg";
import fs from "node:fs";
import path from "node:path";
export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgresql://hackrails:hackrails@localhost:5432/hackrails",
});
export async function transaction<T>(
  fn: (c: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function migrate() {
  await pool.query(
    fs.readFileSync(
      path.resolve(process.cwd(), "../../db/init/001-schema.sql"),
      "utf8",
    ),
  );
}
