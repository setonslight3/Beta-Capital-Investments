import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/alphavest',
  ssl: false
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error listing tables:', err);
  } finally {
    await client.end();
  }
}

run();
