import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('----------------------------------------------------');
  console.log('🏥 TriageVoice AI - Database Migration Runner');
  console.log('----------------------------------------------------');

  const migrationFilePath = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');

  if (!fs.existsSync(migrationFilePath)) {
    console.error(`❌ Migration file not found at: ${migrationFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
  console.log(`📄 Loaded migration SQL from: ${migrationFilePath}`);

  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (databaseUrl) {
    console.log('🔌 Connecting to PostgreSQL database via connection string...');
    const client = new pg.Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('✅ Connected to PostgreSQL. Applying SQL migration...');
      await client.query(sqlContent);
      console.log('🎉 Migration applied successfully to PostgreSQL!');
      await client.end();
      return;
    } catch (err) {
      console.error('❌ Failed to run migration on PostgreSQL directly:', err.message);
      if (client) await client.end().catch(() => {});
    }
  } else {
    console.log('⚠️  DATABASE_URL / SUPABASE_DB_URL is not set in server/.env.');
    console.log('ℹ️  You can copy and paste the contents of:');
    console.log(`    ${migrationFilePath}`);
    console.log('    directly into your Supabase Dashboard -> SQL Editor.');
    console.log('ℹ️  Or set DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres in server/.env and re-run.');
  }
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
