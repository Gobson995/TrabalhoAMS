import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/db';
import { resetarBanco, criarUsuario, SENHA_PADRAO } from '../setup/helpers';
import { Papel } from '../../src/types/domain';

const app = createApp();

describe('Autenticação', () => {
  beforeEach(resetarBanco);

  it('registro cria um Colaborador e inicia sessão', async () => {
    const res = await request(app)
      .post('/registrar')
      .type('form')
      .send({ nome: 'Maria', email: 'maria@x.com', senha: 'senhaForte1' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/colaborador/submissoes');

    const { rows } = await pool.query('SELECT papel FROM usuario WHERE email = $1', ['maria@x.com']);
    expect(rows[0].papel).toBe(Papel.COLABORADOR);
  });

  it('login com senha incorreta retorna 401', async () => {
    await criarUsuario(Papel.ADMINISTRADOR, 'adm@x.com');
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'adm@x.com', senha: 'errada' });
    expect(res.status).toBe(401);
  });

  it('login correto redireciona e abre sessão', async () => {
    await criarUsuario(Papel.ADMINISTRADOR, 'adm@x.com');
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'adm@x.com', senha: SENHA_PADRAO, retorno: '/admin' });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/admin');
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
