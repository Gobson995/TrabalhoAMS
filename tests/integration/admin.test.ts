import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/db';
import { resetarBanco, criarUsuario } from '../setup/helpers';
import { Papel } from '../../src/types/domain';

const app = createApp();
const fakeMp4 = Buffer.from('00000000667479706d70343200000000', 'hex');

async function logar(papel: Papel, email: string) {
  const u = await criarUsuario(papel, email);
  const agent = request.agent(app);
  await agent.post('/login').type('form').send({ email: u.email, senha: u.senha });
  return { agent, id: u.id };
}

describe('Administração de usuários (CRUD)', () => {
  beforeEach(resetarBanco);

  it('Admin cria, edita papel e exclui usuário', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');

    // Criar
    const criar = await admin.agent.post('/admin/usuarios').type('form').send({
      nome: 'Novo Revisor', email: 'novo@x.com', senha: 'senha12345', papel: Papel.REVISOR,
    });
    expect(criar.status).toBe(302);
    let { rows } = await pool.query('SELECT id, papel FROM usuario WHERE email = $1', ['novo@x.com']);
    expect(rows[0].papel).toBe(Papel.REVISOR);
    const alvoId = rows[0].id;

    // Editar papel -> Administrador
    const editar = await admin.agent.post(`/admin/usuarios/${alvoId}`).type('form').send({
      nome: 'Novo Revisor', email: 'novo@x.com', papel: Papel.ADMINISTRADOR, ativo: 'on',
    });
    expect(editar.status).toBe(302);
    rows = (await pool.query('SELECT papel FROM usuario WHERE id = $1', [alvoId])).rows;
    expect(rows[0].papel).toBe(Papel.ADMINISTRADOR);

    // Excluir
    const excluir = await admin.agent.post(`/admin/usuarios/${alvoId}/excluir`);
    expect(excluir.status).toBe(302);
    const cont = await pool.query('SELECT count(*)::int AS n FROM usuario WHERE id = $1', [alvoId]);
    expect(cont.rows[0].n).toBe(0);
  });

  it('Admin gerencia sinais (CRUD direto)', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');
    const criar = await admin.agent.post('/admin/sinais').type('form').send({
      palavra: 'LIVRO', acepcao: 'Conjunto de folhas', origem: 'nacional',
    });
    expect(criar.status).toBe(302);
    const { rows } = await pool.query('SELECT id FROM sinal WHERE palavra = $1', ['LIVRO']);
    expect(rows.length).toBe(1);

    const excluir = await admin.agent.post(`/admin/sinais/${rows[0].id}/excluir`);
    expect(excluir.status).toBe(302);
  });

  it('Admin cria sinal PUBLICADO com vídeo e ele aparece na busca pública', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');
    const criar = await admin.agent
      .post('/admin/sinais')
      .field('palavra', 'JANELA')
      .field('acepcao', 'Abertura na parede')
      .field('origem', 'nacional')
      .field('status', 'PUBLICADO')
      .attach('video', fakeMp4, { filename: 'janela.mp4', contentType: 'video/mp4' });
    expect(criar.status).toBe(302);

    const { rows } = await pool.query('SELECT id, status FROM sinal WHERE palavra = $1', ['JANELA']);
    expect(rows[0].status).toBe('PUBLICADO');
    const vid = await pool.query('SELECT count(*)::int AS n FROM video WHERE sinal_id = $1', [rows[0].id]);
    expect(vid.rows[0].n).toBe(1);

    const home = await request(app).get('/?criterio=palavra&termo=JANELA');
    expect(home.text).toContain('JANELA');
  });

  it('Admin adiciona vídeo a um sinal que não tinha (edição)', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');
    const { rows } = await pool.query(
      `INSERT INTO sinal (palavra, status) VALUES ('SEMVIDEO','PUBLICADO') RETURNING id`,
    );
    const id = rows[0].id;
    const antes = await pool.query('SELECT count(*)::int AS n FROM video WHERE sinal_id = $1', [id]);
    expect(antes.rows[0].n).toBe(0);

    const editar = await admin.agent
      .post(`/admin/sinais/${id}`)
      .field('palavra', 'SEMVIDEO')
      .field('status', 'PUBLICADO')
      .attach('video', fakeMp4, { filename: 'sv.mp4', contentType: 'video/mp4' });
    expect(editar.status).toBe(302);

    const depois = await pool.query('SELECT count(*)::int AS n FROM video WHERE sinal_id = $1', [id]);
    expect(depois.rows[0].n).toBe(1);
  });

  it('Admin exclui um sinal que tem vídeo (cascata)', async () => {
    const admin = await logar(Papel.ADMINISTRADOR, 'admin@x.com');
    await admin.agent
      .post('/admin/sinais')
      .field('palavra', 'APAGAR')
      .field('status', 'PUBLICADO')
      .attach('video', fakeMp4, { filename: 'a.mp4', contentType: 'video/mp4' });
    const { rows } = await pool.query('SELECT id FROM sinal WHERE palavra = $1', ['APAGAR']);
    const id = rows[0].id;
    expect((await pool.query('SELECT count(*)::int n FROM video WHERE sinal_id=$1', [id])).rows[0].n).toBe(1);

    const excluir = await admin.agent.post(`/admin/sinais/${id}/excluir`);
    expect(excluir.status).toBe(302);
    expect(excluir.headers.location).toContain('ok=excluido');
    expect((await pool.query('SELECT count(*)::int n FROM sinal WHERE id=$1', [id])).rows[0].n).toBe(0);
    expect((await pool.query('SELECT count(*)::int n FROM video WHERE sinal_id=$1', [id])).rows[0].n).toBe(0);
  });

  it('Colaborador é barrado na administração (403)', async () => {
    const colab = await logar(Papel.COLABORADOR, 'colab@x.com');
    const res = await colab.agent.get('/admin/usuarios');
    expect(res.status).toBe(403);
  });

  it('Visitante não autenticado é redirecionado ao login (302)', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('/login');
  });
});
