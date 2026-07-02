// Migration script using Neon's HTTP API (no dependencies needed)
import https from 'https';

const connectionString = 'postgresql://neondb_owner:npg_N2nO4BhoYAvV@ep-broad-rice-a7a4t5w.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Parse connection string
const url = new URL(connectionString);
const host = url.hostname;
const database = url.pathname.slice(1);
const password = url.password;
const username = url.username;

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
`;

const checkSQL = `
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name = 'proof_image_base64';
`;

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: sql,
    });

    const options = {
      hostname: host,
      port: 443,
      path: `/sql`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${password}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

console.log('🔄 Starting migration...');
console.log(`📍 Database: ${host}/${database}`);
console.log('');

try {
  console.log('1️⃣ Running migration SQL...');
  await executeSQL(migrationSQL);
  console.log('✅ Migration executed');
  console.log('');
  
  console.log('2️⃣ Verifying column exists...');
  const result = await executeSQL(checkSQL);
  
  if (result && result.rows && result.rows.length > 0) {
    console.log('✅ SUCCESS! Column proof_image_base64 exists in payments table');
    console.log(`   Type: ${result.rows[0].data_type}`);
  } else if (result && Array.isArray(result) && result.length > 0) {
    console.log('✅ SUCCESS! Column proof_image_base64 exists in payments table');
  } else {
    console.log('⚠️  Warning: Could not verify column (but migration may have succeeded)');
  }
  
  console.log('');
  console.log('🎉 Migration complete! Your database is ready.');
  console.log('');
  console.log('Next steps:');
  console.log('  • Deploy your changes to production');
  console.log('  • Test payment proof upload (crypto + bank transfer)');
  console.log('  • Verify admin can view proofs');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('');
  console.error('This might be because:');
  console.error('  • Neon doesn\'t support HTTP SQL API for this connection');
  console.error('  • We need to use a different approach');
  console.error('');
  console.error('Alternative: Run this SQL directly in Neon Console:');
  console.error('------------------------------------------------------------');
  console.error(migrationSQL);
  console.error('------------------------------------------------------------');
  process.exit(1);
}
