import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse DATABASE_URL and explicitly set SSL mode to avoid future deprecation warnings
const databaseUrl = process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === "production";

// For production, explicitly configure SSL but bypass strict hostname/CA validation (rejectUnauthorized: false)
// which is required for serverless connections to Neon/Supabase/Render Postgres databases.
// For development, allow connection without SSL.
const poolConfig: pg.PoolConfig = {
  connectionString: databaseUrl,
  ssl: isProd
    ? {
        rejectUnauthorized: false,
      }
    : false,
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
