import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/db';
import { resetarBanco, criarUsuario, inserirSinalPublicado } from '../setup/helpers';
import { Papel } from '../../src/types/domain';

const app = createApp();

async function logar(papel: Papel, email: string) {
  const u = await criarUsuario(papel, email);
  const agent = request.agent(app);
  await agent.post('/login').type('form').send({ email: u.email, senha: u.senha });
  return { agent, id: u.id };
}

describe('Carregamento de telas e edição', () => {
  beforeEach(resetarBanco);

  it('páginas públicas e de autenticação respondem 200', async () => {
    for (const url of ['/', '/sobre', '/login', '/registrar']) {
      const res = await request(app).get(url);
      expect(res.status).toBe(200);
    }
  });

  it('Colaborador acessa o formulário e a lista de submissões', async () => {
    const colab = await logar(Papel.COLABORADOR, 'colab@x.com');
    expect((await colab.agent.get('/colaborador/novo')).status).toBe(200);
    expect((await colab.agent.get('/colaborador/submissoes')).status).toBe(200);
  });

  it('Revisor abre a fila e a tela de avaliação de um pendente', async () => {
    const colab = await logar(Papel.COLABORADOR, 'colab@x.com');
    const { rows } = await pool.query(
      `INSERT INTO sinal (palavra, status, criado_por) VALUES ('TESTE','PENDENTE',$1) RETURNING id`,
      [colab.id],
    );
    const revisor = await logar(Papel.REVISOR, 'rev@x.com');
    expect((await revisor.agent.get('/revisao')).status).toBe(200);
    expect((await revisor.agent.get(`/revisao/${rows[0].id}`)).status).toBe(200);
  });

  it('Admin abre painel, listas, formulários e auditoria', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');
    const sinalId = await inserirSinalPublicado('CASA', admin.id);
    const usuarioId = (await criarUsuario(Papel.REVISOR, 'outro@x.com')).id;

    for (const url of [
      '/admin',
      '/admin/sinais',
      '/admin/sinais/novo',
      `/admin/sinais/${sinalId}/editar`,
      '/admin/usuarios',
      '/admin/usuarios/novo',
      `/admin/usuarios/${usuarioId}/editar`,
      '/admin/auditoria',
    ]) {
      const res = await admin.agent.get(url);
      expect(res.status).toBe(200);
    }
  });

  it('Admin edita um sinal (SinalService.editar)', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');
    const sinalId = await inserirSinalPublicado('ANTIGO', admin.id);
    const res = await admin.agent
      .post(`/admin/sinais/${sinalId}`)
      .type('form')
      .send({ palavra: 'NOVO', acepcao: 'Atualizado', origem: 'regional' });
    expect(res.status).toBe(302);
    const { rows } = await pool.query('SELECT palavra, origem FROM sinal WHERE id = $1', [sinalId]);
    expect(rows[0].palavra).toBe('NOVO');
    expect(rows[0].origem).toBe('regional');
  });
});
