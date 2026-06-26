import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

const config: PoolConfig = env.db.connectionString
  ? { connectionString: env.db.connectionString }
  : {
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
    };

export const pool = new Pool({ ...config, max: 10 });

pool.on('error', (err) => {
  console.error('[db] erro inesperado no cliente ocioso:', err.message);
});

export function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params as never[]);
}

export async function withTransaction<T>(fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
