/** Acesso a dados de LGPD: trilha de auditoria e registros de consentimento. */
import { Pool, PoolClient } from 'pg';
import { pool as defaultPool } from '../config/db';
import { AuditLog, ConsentRecord, TipoDadoSensivel } from '../types/domain';
import { mapAuditLog, mapConsent } from './mappers';

export class AuditLogRepository {
  constructor(private readonly pool: Pool = defaultPool) {}

  async registrar(
    entrada: {
      usuarioId: string | null;
      acao: string;
      entidade: string;
      entidadeId: string | null;
      detalhes?: string | null;
    },
    client?: PoolClient,
  ): Promise<void> {
    const exec = client ?? this.pool;
    await exec.query(
      `INSERT INTO audit_log (usuario_id, acao, entidade, entidade_id, detalhes)
       VALUES ($1,$2,$3,$4,$5)`,
      [entrada.usuarioId, entrada.acao, entrada.entidade, entrada.entidadeId, entrada.detalhes ?? null],
    );
  }

  /** Admin vê tudo; demais consumidores podem filtrar por entidade. */
  async listar(filtro?: { entidade?: string; entidadeId?: string }): Promise<AuditLog[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    if (filtro?.entidade) {
      where.push(`entidade = $${i++}`);
      params.push(filtro.entidade);
    }
    if (filtro?.entidadeId) {
      where.push(`entidade_id = $${i++}`);
      params.push(filtro.entidadeId);
    }
    const { rows } = await this.pool.query(
      `SELECT * FROM audit_log ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY data_hora DESC LIMIT 500`,
      params,
    );
    return rows.map(mapAuditLog);
  }
}

export class ConsentRepository {
  constructor(private readonly pool: Pool = defaultPool) {}

  async registrar(
    dados: {
      usuarioId: string | null;
      sujeito: string | null;
      tipoDado: TipoDadoSensivel;
      contemMenor: boolean;
      consentimentoConcedido: boolean;
      baseLegal: string;
    },
    client?: PoolClient,
  ): Promise<ConsentRecord> {
    const exec = client ?? this.pool;
    const { rows } = await exec.query(
      `INSERT INTO consent_record
        (usuario_id, sujeito, tipo_dado, contem_menor, consentimento_concedido, data_consentimento, base_legal)
       VALUES ($1,$2,$3,$4,$5, CASE WHEN $5 THEN now() ELSE NULL END, $6)
       RETURNING *`,
      [
        dados.usuarioId,
        dados.sujeito,
        dados.tipoDado,
        dados.contemMenor,
        dados.consentimentoConcedido,
        dados.baseLegal,
      ],
    );
    return mapConsent(rows[0]);
  }

  async listar(): Promise<ConsentRecord[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM consent_record ORDER BY data_consentimento DESC NULLS LAST',
    );
    return rows.map(mapConsent);
  }
}
