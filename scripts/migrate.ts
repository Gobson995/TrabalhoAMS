import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from '../src/config/db';
import { explicarErroConexao } from '../src/utils/dbError';

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function ensureControlTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      nome       TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function reset() {
  console.log('[migrate] --reset: recriando schema public...');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
}

async function applied(): Promise<Set<string>> {
  const { rows } = await pool.query<{ nome: string }>('SELECT nome FROM _migrations');
  return new Set(rows.map((r) => r.nome));
}

async function main() {
  const doReset = process.argv.includes('--reset');
  if (doReset) await reset();
  await ensureControlTable();

  const done = await applied();
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let count = 0;
  for (const file of files) {
    if (done.has(file)) {
      console.log(`[migrate] já aplicada: ${file}`);
      continue;
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`[migrate] aplicando: ${file}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (nome) VALUES ($1)', [file]);
      await client.query('COMMIT');
      count++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] FALHA em ${file}:`, (err as Error).message);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(`[migrate] concluído. ${count} migration(s) aplicada(s).`);
  await pool.end();
}

main().catch((err) => {
  if (!explicarErroConexao(err)) console.error(err);
  process.exit(1);
});
