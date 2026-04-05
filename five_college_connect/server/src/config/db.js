import pg from "pg";

import { env } from "./env.js";

const { Pool } = pg;

export const dbConfig = {
  connectionString: env.databaseUrl,
  ssl: env.dbSsl ? { rejectUnauthorized: false } : false
};

// One shared pool keeps database access consistent across the app.
// Frontend does not use this directly; controllers/services call repositories,
// and repositories call these helpers.
export const pool = new Pool(dbConfig);

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function testDatabaseConnection() {
  const result = await query("SELECT NOW() AS connected_at");
  return result.rows[0];
}

export function getDbStatus() {
  return {
    configured: Boolean(env.databaseUrl),
    sslEnabled: env.dbSsl
  };
}
