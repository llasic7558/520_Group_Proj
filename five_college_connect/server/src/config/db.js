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


let compatibilityMigrationPromise = null;

function ignoreDuplicateSetupError(error) {
  if (!error) {
    return false;
  }

  return (
    error.code === "23505" ||
    error.code === "42P07"
  );
}

async function applyCompatibilityMigrations() {
  if (!compatibilityMigrationPromise) {
    compatibilityMigrationPromise = (async () => {
      await query(`
        ALTER TABLE users
        DROP CONSTRAINT IF EXISTS users_username_key
      `);

      try {
        await query(`
          CREATE EXTENSION IF NOT EXISTS pg_trgm
        `);
      } catch (error) {
        if (!ignoreDuplicateSetupError(error)) {
          throw error;
        }
      }

      try {
        await query(`
          CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
          ON listings
          USING gin (title gin_trgm_ops)
        `);
      } catch (error) {
        if (!ignoreDuplicateSetupError(error)) {
          throw error;
        }
      }
    })();
  }

  return compatibilityMigrationPromise;
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
