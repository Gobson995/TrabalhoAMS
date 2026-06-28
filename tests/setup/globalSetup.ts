import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client, Pool } from 'pg';

const TEST_DB = 'dicionario_libras_test';

const baseConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'libras',
  password: process.env.DB_PASSWORD ?? 'libras_dev_password',
};

export default async function globalSetup(): Promise<void> {
  const admin = new Client({ ...baseConfig, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE ${TEST_DB}`);
  }
  await admin.end();

  const pool = new Pool({ ...baseConfig, database: TEST_DB });
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

  const migrationsDir = join(__dirname, '..', '..', 'migrations');
  const arquivos = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const arq of arquivos) {
    await pool.query(readFileSync(join(migrationsDir, arq), 'utf8'));
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
  await pool.end();
  console.log(`\n[testes] banco ${TEST_DB} pronto (${arquivos.length} migration[s]).`);
}
