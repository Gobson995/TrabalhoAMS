import request from 'supertest';
import { createApp } from '../../src/app';
import { pool } from '../../src/config/db';
import { resetarBanco, inserirSinalPublicado } from '../setup/helpers';
import { StatusSinal } from '../../src/types/domain';

const app = createApp();

describe('Rotas públicas (Visitante)', () => {
  let publicadoId: string;
  let pendenteId: string;

  beforeEach(async () => {
    await resetarBanco();
    publicadoId = await inserirSinalPublicado('MAMÃE');
    const { rows } = await pool.query(
      `INSERT INTO sinal (palavra, status) VALUES ($1,$2) RETURNING id`,
      ['ESCOLA', StatusSinal.PENDENTE],
    );
    pendenteId = rows[0].id;
  });

  it('GET / lista apenas sinais publicados', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('MAMÃE');
    expect(res.text).not.toContain('>ESCOLA<');
  });

  it('GET /sinal/:id publicado retorna 200', async () => {
    const res = await request(app).get(`/sinal/${publicadoId}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('MAMÃE');
  });

  it('GET /sinal/:id de sinal PENDENTE retorna 404 ao visitante', async () => {
    const res = await request(app).get(`/sinal/${pendenteId}`);
    expect(res.status).toBe(404);
  });

  it('busca por palavra filtra os resultados', async () => {
    await inserirSinalPublicado('PAI');
    const res = await request(app).get('/?criterio=palavra&termo=PAI');
    expect(res.text).toContain('PAI');
    expect(res.text).not.toContain('MAMÃE');
  });
});
