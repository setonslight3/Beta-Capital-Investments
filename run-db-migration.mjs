#!/usr/bin/env node
/**
 * Direct database migration using pg module
 * This bypasses all workspace complexity
 */

import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://neondb_owner:npg_N2nO4BhoYAvV@ep-broad-rice-aq7a4t5w.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

const migrationSQL = `
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'proof_image_base64'
    ) THEN
        ALTER TABLE payments 
        ADD COLUMN proof_image_base64 TEXT NULL;
        RAISE NOTICE 'Column proof_image_base64 added to payments table';
    ELSE
        RAISE NOTICE 'Column proof_image_base64 already exists in payments table';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_status_proof 
ON payments(status) 
WHERE proof_image_base64 IS NOT NULL;

COMMENT ON COLUMN payments.proof_image_base64 IS 'Base64 encoded payment proof image (receipt/screenshot) - nullable for backward compatibility';
`;

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  Database Migration: Add proof_image_base64 Column   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('🔄 Connecting to Neon database...');
    console.log(`   Host: ep-broad-rice-aq7a4t5w.c-8.us-east-1.aws.neon.tech`);
    console.log(`   Database: neondb\n`);
    
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    console.log('1️⃣ Running migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed\n');
    
    console.log('2️⃣ Verifying column exists...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'proof_image_base64'
    `);
    
    if (checkResult.rows.length > 0) {
      const col = checkResult.rows[0];
      console.log('✅ SUCCESS! Column proof_image_base64 exists:');
      console.log(`   Name: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}\n`);
      
      console.log('╔════════════════════════════════════════════════════════╗');
      console.log('║                🎉 MIGRATION COMPLETE! 🎉              ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log('✅ What works now:');
      console.log('   • Payment proof uploads (crypto + bank transfer)');
      console.log('   • Admin dashboard "View Proof" buttons');
      console.log('   • All existing payments remain unchanged\n');
      console.log('👉 Ready to deploy to production!\n');
    } else {
      console.log('❌ Warning: Column not found after migration\n');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n⚠️  Password authentication failed.');
      console.error('    The connection string password may be incomplete.');
      console.error('    Please provide the FULL Neon connection string from your dashboard.\n');
    }
    
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connection closed\n');
  }
}

runMigration().catch((err) => {
  process.exit(1);
});
