/** Ponto de entrada: inicia o servidor HTTP. */
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

app.listen(env.port, () => {
  console.log(`\n  Dicionário Libras+ rodando em http://localhost:${env.port}`);
  console.log(`  Ambiente: ${env.nodeEnv}\n`);
});
