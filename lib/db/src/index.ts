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

// Run database startup migrations to ensure new schema columns exist
const migrationSql = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);
  ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_image_base64 TEXT;
  CREATE TABLE IF NOT EXISTS kyc_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL,
    file_data_base64 TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_note TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
`;

pool.query(migrationSql)
  .then(() => {
    console.log("Database startup migrations executed successfully.");
  })
  .catch((err) => {
    console.error("Database startup migrations failed:", err);
  });

export const db = drizzle(pool, { schema });

export * from "./schema";
