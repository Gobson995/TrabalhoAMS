/** Acesso a dados de Assunto/Categoria. */
import { Pool } from 'pg';
import { pool as defaultPool } from '../config/db';
import { Assunto } from '../types/domain';
import { mapAssunto } from './mappers';

export class AssuntoRepository {
  constructor(private readonly pool: Pool = defaultPool) {}

  async listar(): Promise<Assunto[]> {
    const { rows } = await this.pool.query('SELECT * FROM assunto ORDER BY nome');
    return rows.map(mapAssunto);
  }

  async criar(nome: string): Promise<Assunto> {
    const { rows } = await this.pool.query(
      'INSERT INTO assunto (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING *',
      [nome],
    );
    return mapAssunto(rows[0]);
  }
}
