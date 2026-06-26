import 'dotenv/config';

function num(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: num(process.env.PORT, 3000),
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-secret-inseguro-troque-no-env',

  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST ?? 'localhost',
    port: num(process.env.DB_PORT, 5432),
    database: process.env.DB_NAME ?? 'dicionario_libras',
    user: process.env.DB_USER ?? 'libras',
    password: process.env.DB_PASSWORD ?? 'libras_dev_password',
  },

  upload: {
    dir: process.env.UPLOAD_DIR ?? 'uploads',
    maxVideoBytes: num(process.env.MAX_VIDEO_SIZE_MB, 50) * 1024 * 1024,
    maxImageBytes: num(process.env.MAX_IMAGE_SIZE_MB, 5) * 1024 * 1024,
  },

  security: {
    loginRateLimit: num(process.env.LOGIN_RATE_LIMIT, 5),
    loginRateWindowMs: num(process.env.LOGIN_RATE_WINDOW_MS, 60_000),
  },
};

if (env.isProd && env.sessionSecret.startsWith('dev-secret')) {
  throw new Error('SESSION_SECRET inseguro em produção. Defina um valor forte no .env.');
}
