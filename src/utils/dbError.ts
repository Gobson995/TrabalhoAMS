export function explicarErroConexao(err: any): boolean {
  const ehConexao =
    err?.code === 'ECONNREFUSED' ||
    (Array.isArray(err?.errors) && err.errors.some((e: any) => e?.code === 'ECONNREFUSED'));
  if (!ehConexao) return false;

  console.error('\n  ✖ Não foi possível conectar ao banco PostgreSQL.\n');
  console.error('  Provavelmente o banco não está no ar. Verifique:');
  console.error('    1) O Docker Desktop está rodando?');
  console.error('    2) Suba o banco:   docker compose up -d postgres pgadmin');
  console.error('    3) Confira DB_HOST/DB_PORT no arquivo .env');
  console.error('       (neste ambiente a porta usada é 5433).\n');
  return true;
}
