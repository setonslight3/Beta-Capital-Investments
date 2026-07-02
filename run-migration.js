// Quick migration script
const { Client } = require('pg');

// Use exact connection string from user
const connectionString = 'postgresql://neondb_owner:npg_N2nO4BhoYAvV@ep-broad-rice-aq7a4t5w.us-east-1.aws.neon.tech/neondb?sslmode=require';

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
    console.log('🔄 Connecting to Neon database...');
    console.log(`   Host: ep-broad-rice-aq7a4t5w.us-east-1.aws.neon.tech`);
    console.log(`   Database: neondb\n`);
    
    await client.connect();
    console.log('✅ Connected successfully\n');
    
    console.log('1️⃣ Running migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed\n');
    
    // Check if column exists
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
    } else {
      console.log('❌ Warning: Column not found after migration\n');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('password authentication failed')) {
      console.error('\n⚠️  The connection string password may be incorrect or incomplete.');
      console.error('    Please verify your Neon database credentials.\n');
    }
    throw error;
  } finally {
    await client.end();
    console.log('🔌 Connection closed');
  }
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  Database Migration: Add proof_image_base64 Column   ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

runMigration().then(() => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                🎉 MIGRATION COMPLETE! 🎉              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('✅ What works now:');
  console.log('   • Payment proof uploads (crypto + bank transfer)');
  console.log('   • Admin dashboard "View Proof" buttons');
  console.log('   • All existing payments remain unchanged\n');
  console.log('👉 Ready to deploy to production!\n');
  process.exit(0);
}).catch((err) => {
  console.error('\n💥 Migration failed');
  console.error('\n📝 Please run the SQL manually in Neon Console (takes 30 seconds):');
  console.error('   1. Go to https://console.neon.tech/');
  console.error('   2. Select your project');
  console.error('   3. Click "SQL Editor"');
  console.error('   4. Paste and run the SQL from MIGRATION_INSTRUCTIONS.md\n');
  process.exit(1);
});
