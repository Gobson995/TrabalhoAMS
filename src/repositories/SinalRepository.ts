/**
 * Acesso a dados de Sinal e seus agregados (variantes, vídeos, assuntos).
 * Implementa a busca/filtros equivalentes ao dicionário INES.
 */
import { Pool, PoolClient } from 'pg';
import { pool as defaultPool } from '../config/db';
import { Sinal } from '../models/Sinal';
import { StatusSinal } from '../types/domain';
import { mapSinal, mapVariante, mapVideo, mapAssunto } from './mappers';

export type CriterioBusca = 'palavra' | 'exemplo' | 'acepcao' | 'assunto';
export type OrdemBusca = 'alfabetica' | 'assunto' | 'mao';

export interface FiltrosBusca {
  criterio?: CriterioBusca;
  termo?: string;
  letra?: string; // filtro alfabético A-Z
  numero?: number;
  ordem?: OrdemBusca;
  somentePublicados?: boolean;
}

/** Campos editáveis de um sinal (usado em criar/atualizar). */
export type DadosSinal = Partial<
  Omit<Sinal, 'id' | 'criadoEm' | 'atualizadoEm' | 'variantes' | 'videos' | 'assuntos'>
>;

export class SinalRepository {
  constructor(private readonly pool: Pool = defaultPool) {}

  async buscar(filtros: FiltrosBusca = {}): Promise<Sinal[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (filtros.somentePublicados) {
      where.push(`s.status = $${i++}`);
      params.push(StatusSinal.PUBLICADO);
    }
    if (filtros.termo && filtros.criterio && filtros.criterio !== 'assunto') {
      const coluna = { palavra: 's.palavra', exemplo: 's.exemplo', acepcao: 's.acepcao' }[
        filtros.criterio
      ];
      where.push(`${coluna} ILIKE $${i++}`);
      params.push(`%${filtros.termo}%`);
    }
    if (filtros.termo && filtros.criterio === 'assunto') {
      where.push(
        `EXISTS (SELECT 1 FROM sinal_assunto sa JOIN assunto a ON a.id = sa.assunto_id
                 WHERE sa.sinal_id = s.id AND a.nome ILIKE $${i++})`,
      );
      params.push(`%${filtros.termo}%`);
    }
    if (filtros.letra) {
      where.push(`s.palavra ILIKE $${i++}`);
      params.push(`${filtros.letra}%`);
    }
    if (filtros.numero != null) {
      where.push(`s.numero = $${i++}`);
      params.push(filtros.numero);
    }

    const ordenacao =
      filtros.ordem === 'mao'
        ? 's.configuracao_mao NULLS LAST, s.palavra'
        : filtros.ordem === 'assunto'
          ? 's.palavra' // ordenação por assunto é tratada na View ao agrupar
          : 's.palavra';

    const sql = `SELECT s.* FROM sinal s
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY ${ordenacao} ASC`;
    const { rows } = await this.pool.query(sql, params);
    return rows.map((r) => new Sinal(mapSinal(r)));
  }

  async buscarPorId(id: string, comAgregados = true): Promise<Sinal | null> {
    const { rows } = await this.pool.query('SELECT * FROM sinal WHERE id = $1', [id]);
    if (!rows[0]) return null;
    const sinal = new Sinal(mapSinal(rows[0]));
    if (comAgregados) await this.carregarAgregados(sinal);
    return sinal;
  }

  private async carregarAgregados(sinal: Sinal): Promise<void> {
    const [variantes, videos, assuntos] = await Promise.all([
      this.pool.query('SELECT * FROM variante_sinal WHERE sinal_id = $1 ORDER BY regiao', [
        sinal.id,
      ]),
      this.pool.query(
        `SELECT v.* FROM video v
         LEFT JOIN variante_sinal vs ON vs.id = v.variante_id
         WHERE v.sinal_id = $1 OR vs.sinal_id = $1 ORDER BY v.criado_em`,
        [sinal.id],
      ),
      this.pool.query(
        `SELECT a.* FROM assunto a JOIN sinal_assunto sa ON sa.assunto_id = a.id
         WHERE sa.sinal_id = $1 ORDER BY a.nome`,
        [sinal.id],
      ),
    ]);
    sinal.variantes = variantes.rows.map(mapVariante);
    sinal.videos = videos.rows.map(mapVideo);
    sinal.assuntos = assuntos.rows.map(mapAssunto);
  }

  async listarPorStatus(status: StatusSinal): Promise<Sinal[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM sinal WHERE status = $1 ORDER BY criado_em DESC',
      [status],
    );
    return rows.map((r) => new Sinal(mapSinal(r)));
  }

  async listarPorCriador(usuarioId: string): Promise<Sinal[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM sinal WHERE criado_por = $1 ORDER BY criado_em DESC',
      [usuarioId],
    );
    return rows.map((r) => new Sinal(mapSinal(r)));
  }

  async criar(dados: DadosSinal, client?: PoolClient): Promise<Sinal> {
    const exec = client ?? this.pool;
    const { rows } = await exec.query(
      `INSERT INTO sinal
        (palavra, numero, acepcao, exemplo, exemplo_libras, classe_gramatical, origem,
         imagem_url, status, ponto_articulacao, configuracao_mao, disposicao_mao,
         orientacao_mao, regiao_contato, componentes_nao_manuais, classificacao, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'nacional')::origem_sinal,$8,
               COALESCE($9,'RASCUNHO')::status_sinal,
               $10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        dados.palavra, dados.numero ?? null, dados.acepcao ?? null, dados.exemplo ?? null,
        dados.exemploLibras ?? null, dados.classeGramatical ?? null, dados.origem ?? null,
        dados.imagemUrl ?? null, dados.status ?? null,
        dados.pontoArticulacao ?? null, dados.configuracaoMao ?? null, dados.disposicaoMao ?? null,
        dados.orientacaoMao ?? null, dados.regiaoContato ?? null, dados.componentesNaoManuais ?? null,
        dados.classificacao ?? null, dados.criadoPor ?? null,
      ],
    );
    return new Sinal(mapSinal(rows[0]));
  }

  async atualizar(id: string, dados: DadosSinal, client?: PoolClient): Promise<Sinal | null> {
    const exec = client ?? this.pool;
    const colunas: Record<string, string> = {
      palavra: 'palavra', numero: 'numero', acepcao: 'acepcao', exemplo: 'exemplo',
      exemploLibras: 'exemplo_libras', classeGramatical: 'classe_gramatical', origem: 'origem',
      imagemUrl: 'imagem_url', status: 'status',
      pontoArticulacao: 'ponto_articulacao', configuracaoMao: 'configuracao_mao',
      disposicaoMao: 'disposicao_mao', orientacaoMao: 'orientacao_mao', regiaoContato: 'regiao_contato',
      componentesNaoManuais: 'componentes_nao_manuais', classificacao: 'classificacao',
      revisadoPor: 'revisado_por',
    };
    const sets: string[] = [];
    const valores: unknown[] = [];
    let i = 1;
    for (const [chave, coluna] of Object.entries(colunas)) {
      if (chave in dados) {
        sets.push(`${coluna} = $${i++}`);
        valores.push((dados as Record<string, unknown>)[chave]);
      }
    }
    if (sets.length === 0) return this.buscarPorId(id);
    valores.push(id);
    const { rows } = await exec.query(
      `UPDATE sinal SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      valores,
    );
    return rows[0] ? new Sinal(mapSinal(rows[0])) : null;
  }

  /** Remove os vídeos vinculados diretamente ao sinal (não às variantes). */
  async removerVideosDoSinal(sinalId: string, client?: PoolClient): Promise<void> {
    const exec = client ?? this.pool;
    await exec.query('DELETE FROM video WHERE sinal_id = $1 AND variante_id IS NULL', [sinalId]);
  }

  async atualizarStatus(
    id: string,
    status: StatusSinal,
    revisadoPor: string | null,
  ): Promise<void> {
    await this.pool.query('UPDATE sinal SET status = $1, revisado_por = $2 WHERE id = $3', [
      status,
      revisadoPor,
      id,
    ]);
  }

  async excluir(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM sinal WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  // --- Agregados auxiliares ---
  async definirAssuntos(sinalId: string, assuntoIds: string[], client?: PoolClient): Promise<void> {
    const exec = client ?? this.pool;
    await exec.query('DELETE FROM sinal_assunto WHERE sinal_id = $1', [sinalId]);
    for (const aId of assuntoIds) {
      await exec.query(
        'INSERT INTO sinal_assunto (sinal_id, assunto_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [sinalId, aId],
      );
    }
  }

  async adicionarVideo(
    alvo: { sinalId?: string; varianteId?: string },
    url: string,
    legendaUrl: string | null,
    tamanhoBytes: number,
    client?: PoolClient,
  ): Promise<void> {
    const exec = client ?? this.pool;
    await exec.query(
      `INSERT INTO video (sinal_id, variante_id, url, legenda_url, tamanho_bytes)
       VALUES ($1,$2,$3,$4,$5)`,
      [alvo.sinalId ?? null, alvo.varianteId ?? null, url, legendaUrl, tamanhoBytes],
    );
  }

  async adicionarVariante(
    sinalId: string,
    regiao: string,
    videoUrl: string | null,
    descricao: string | null,
    client?: PoolClient,
  ): Promise<string> {
    const exec = client ?? this.pool;
    const { rows } = await exec.query(
      `INSERT INTO variante_sinal (sinal_id, regiao, video_url, descricao)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [sinalId, regiao, videoUrl, descricao],
    );
    return rows[0].id;
  }
}
