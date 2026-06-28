import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/db';
import { resetarBanco, criarUsuario } from '../setup/helpers';
import { Papel, StatusSinal } from '../../src/types/domain';

const app = createApp();

async function logar(papel: Papel, email: string) {
  const u = await criarUsuario(papel, email);
  const agent = request.agent(app);
  await agent.post('/login').type('form').send({ email: u.email, senha: u.senha });
  return { agent, id: u.id };
}

const fakeMp4 = Buffer.from('00000000667479706d70343200000000', 'hex');

describe('Fluxo de aprovação de novo sinal com vídeo', () => {
  beforeEach(resetarBanco);

  it('Colaborador submete (PENDENTE) → Revisor aprova (PUBLICADO) → visível ao Visitante', async () => {
    const colaborador = await logar(Papel.COLABORADOR, 'colab@x.com');

    const submit = await colaborador.agent
      .post('/colaborador/novo')
      .field('palavra', 'CACHORRO')
      .field('acepcao', 'Animal de estimação')
      .field('classificacao', 'UMA_MAO')
      .attach('video', fakeMp4, { filename: 'cachorro.mp4', contentType: 'video/mp4' });
    expect(submit.status).toBe(302);

    const apos = await pool.query('SELECT id, status, criado_por FROM sinal WHERE palavra = $1', ['CACHORRO']);
    expect(apos.rows[0].status).toBe(StatusSinal.PENDENTE);
    expect(apos.rows[0].criado_por).toBe(colaborador.id);
    const sinalId = apos.rows[0].id;

    const vid = await pool.query('SELECT count(*)::int AS n FROM video WHERE sinal_id = $1', [sinalId]);
    expect(vid.rows[0].n).toBe(1);

    // Revisor aprova
    const revisor = await logar(Papel.REVISOR, 'rev@x.com');
    const fila = await revisor.agent.get('/revisao');
    expect(fila.text).toContain('CACHORRO');

    const aprovar = await revisor.agent.post(`/revisao/${sinalId}/aprovar`).type('form').send({ comentario: 'ok' });
    expect(aprovar.status).toBe(302);

    const final = await pool.query('SELECT status, revisado_por FROM sinal WHERE id = $1', [sinalId]);
    expect(final.rows[0].status).toBe(StatusSinal.PUBLICADO);
    expect(final.rows[0].revisado_por).toBe(revisor.id);

    const rev = await pool.query('SELECT count(*)::int AS n FROM revisao WHERE sinal_id = $1', [sinalId]);
    expect(rev.rows[0].n).toBe(1);
    const audit = await pool.query(`SELECT count(*)::int AS n FROM audit_log WHERE acao = 'APROVAR'`);
    expect(audit.rows[0].n).toBe(1);

    // Visível ao visitante
    const publico = await request(app).get(`/sinal/${sinalId}`);
    expect(publico.status).toBe(200);
    expect(publico.text).toContain('CACHORRO');
  });

  it('Revisor pode rejeitar com justificativa (REJEITADO)', async () => {
    const colaborador = await logar(Papel.COLABORADOR, 'colab@x.com');
    await colaborador.agent
      .post('/colaborador/novo')
      .field('palavra', 'GATO')
      .attach('video', fakeMp4, { filename: 'gato.mp4', contentType: 'video/mp4' });
    const { rows } = await pool.query('SELECT id FROM sinal WHERE palavra = $1', ['GATO']);

    const revisor = await logar(Papel.REVISOR, 'rev@x.com');
    const res = await revisor.agent
      .post(`/revisao/${rows[0].id}/rejeitar`)
      .type('form')
      .send({ comentario: 'Faltam parâmetros.' });
    expect(res.status).toBe(302);

    const final = await pool.query('SELECT status FROM sinal WHERE id = $1', [rows[0].id]);
    expect(final.rows[0].status).toBe(StatusSinal.REJEITADO);
  });

  it('LGPD: submissão com pessoa identificável SEM consentimento é bloqueada (400)', async () => {
    const colaborador = await logar(Papel.COLABORADOR, 'colab@x.com');
    const res = await colaborador.agent
      .post('/colaborador/novo')
      .field('palavra', 'PRIVADO')
      .field('contemPessoaIdentificavel', 'on') // sem consentimentoConcedido
      .attach('video', fakeMp4, { filename: 'p.mp4', contentType: 'video/mp4' });
    expect(res.status).toBe(400);

    const { rows } = await pool.query('SELECT count(*)::int AS n FROM sinal WHERE palavra = $1', ['PRIVADO']);
    expect(rows[0].n).toBe(0);
  });

  it('Colaborador NÃO acessa a fila de revisão (403)', async () => {
    const colaborador = await logar(Papel.COLABORADOR, 'colab@x.com');
    const res = await colaborador.agent.get('/revisao');
    expect(res.status).toBe(403);
  });
});
