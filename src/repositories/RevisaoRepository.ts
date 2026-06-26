/** Acesso a dados das decisões de revisão (fluxo de aprovação). */
import { Pool, PoolClient } from 'pg';
import { pool as defaultPool } from '../config/db';
import { DecisaoRevisao, Revisao } from '../types/domain';
import { mapRevisao } from './mappers';

export class RevisaoRepository {
  constructor(private readonly pool: Pool = defaultPool) {}

  async registrar(
    sinalId: string,
    revisorId: string,
    decisao: DecisaoRevisao,
    comentario: string | null,
    client?: PoolClient,
  ): Promise<Revisao> {
    const exec = client ?? this.pool;
    const { rows } = await exec.query(
      `INSERT INTO revisao (sinal_id, revisor_id, decisao, comentario)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [sinalId, revisorId, decisao, comentario],
    );
    return mapRevisao(rows[0]);
  }

  async listarPorSinal(sinalId: string): Promise<Revisao[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM revisao WHERE sinal_id = $1 ORDER BY data DESC',
      [sinalId],
    );
    return rows.map(mapRevisao);
  }
}
