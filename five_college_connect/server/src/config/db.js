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

async function applyCompatibilityMigrations() {
  await query(`
    ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_username_key
  `);
}

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
  await applyCompatibilityMigrations();
  const result = await query("SELECT NOW() AS connected_at");
  return result.rows[0];
}

export async function getDbHealth() {
  const baseStatus = {
    configured: Boolean(env.databaseUrl),
    sslEnabled: env.dbSsl
  };

  if (!baseStatus.configured) {
    return {
      ...baseStatus,
      status: "misconfigured"
    };
  }

  const startedAt = Date.now();

  try {
    await query("SELECT 1");
    return {
      ...baseStatus,
      status: "ok",
      latencyMs: Date.now() - startedAt
    };
  } catch {
    return {
      ...baseStatus,
      status: "unavailable"
    };
  }
}

export function getDbStatus() {
  return {
    configured: Boolean(env.databaseUrl),
    sslEnabled: env.dbSsl
  };
}
