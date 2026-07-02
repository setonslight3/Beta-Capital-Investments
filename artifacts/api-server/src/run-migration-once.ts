/**
 * One-time migration script to add proof_image_base64 column
 * Run this once, then delete this file
 * 
 * Usage: npx tsx src/run-migration-once.ts
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log('🔄 Starting migration...');
  console.log('');

  try {
    // Step 1: Add column if it doesn't exist
    console.log('1️⃣ Adding proof_image_base64 column to payments table...');
    
    await db.execute(sql`
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
    `);
    
    console.log('✅ Column added/verified');
    console.log('');

    // Step 2: Create index
    console.log('2️⃣ Creating index for performance...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_payments_status_proof 
      ON payments(status) 
      WHERE proof_image_base64 IS NOT NULL;
    `);
    
    console.log('✅ Index created');
    console.log('');

    // Step 3: Verify
    console.log('3️⃣ Verifying migration...');
    
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'proof_image_base64';
    `);
    
    if (result.rows && result.rows.length > 0) {
      const col = result.rows[0] as any;
      console.log('✅ SUCCESS! Column exists:');
      console.log(`   Name: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
    } else {
      console.log('⚠️  Warning: Could not verify column');
    }
    
    console.log('');
    console.log('🎉 Migration complete! Your database is ready.');
    console.log('');
    console.log('✅ What works now:');
    console.log('   • Payment proof uploads (crypto + bank transfer)');
    console.log('   • Admin dashboard "View Proof" buttons');
    console.log('   • All existing payments remain unchanged');
    console.log('');
    console.log('👉 You can safely delete this file now: src/run-migration-once.ts');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run it
runMigration();
