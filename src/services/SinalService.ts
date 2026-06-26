/**
 * Serviço de Sinais — coração das regras de negócio do dicionário:
 *  - busca/visibilidade (somente PUBLICADO ao Visitante);
 *  - CRUD com verificação de RBAC no servidor;
 *  - fluxo de aprovação (submeter → PENDENTE → aprovar/rejeitar → PUBLICADO/REJEITADO);
 *  - consentimento LGPD ao anexar mídia com pessoa identificável;
 *  - trilha de auditoria em toda alteração relevante.
 */
import { withTransaction } from '../config/db';
import { SinalRepository, DadosSinal, FiltrosBusca } from '../repositories/SinalRepository';
import { RevisaoRepository } from '../repositories/RevisaoRepository';
import { AuditLogRepository, ConsentRepository } from '../repositories/AuditConsentRepository';
import { Sinal } from '../models/Sinal';
import { Usuario } from '../models/Usuario';
import { DecisaoRevisao, StatusSinal, TipoDadoSensivel } from '../types/domain';
import { Permissao } from '../types/rbac';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

export interface MidiaSubmissao {
  videoUrl: string;
  legendaUrl: string | null;
  tamanhoBytes: number;
  contemPessoaIdentificavel: boolean;
  contemMenor: boolean;
  consentimentoConcedido: boolean;
}

export interface DadosSubmissao {
  dados: DadosSinal;
  assuntoIds?: string[];
  midia?: MidiaSubmissao;
}

export class SinalService {
  constructor(
    private readonly sinais = new SinalRepository(),
    private readonly revisoes = new RevisaoRepository(),
    private readonly auditoria = new AuditLogRepository(),
    private readonly consentimentos = new ConsentRepository(),
  ) {}

  // -------------------- Consultas --------------------

  /** Busca pública: força o filtro de publicados. */
  buscarPublicados(filtros: FiltrosBusca = {}): Promise<Sinal[]> {
    return this.sinais.buscar({ ...filtros, somentePublicados: true });
  }

  /** Busca administrativa: enxerga todos os status. */
  buscarTodos(filtros: FiltrosBusca = {}): Promise<Sinal[]> {
    return this.sinais.buscar({ ...filtros, somentePublicados: false });
  }

  /**
   * Detalhe de um sinal. Visitante só acessa PUBLICADO. Autor acessa os próprios.
   * Revisor/Admin acessam qualquer um.
   */
  async obterDetalhe(id: string, usuario?: Usuario): Promise<Sinal> {
    const sinal = await this.sinais.buscarPorId(id);
    if (!sinal) throw new NotFoundError('Sinal não encontrado.');
    if (sinal.estaPublicado()) return sinal;

    const ehAutor = usuario && sinal.criadoPor === usuario.id;
    const ehRevisor = usuario?.ehRevisorOuAdmin();
    if (!ehAutor && !ehRevisor) {
      throw new NotFoundError('Sinal não encontrado.'); // não revela existência de não publicados
    }
    return sinal;
  }

  listarPendentes(): Promise<Sinal[]> {
    return this.sinais.listarPorStatus(StatusSinal.PENDENTE);
  }

  listarMinhasSubmissoes(usuarioId: string): Promise<Sinal[]> {
    return this.sinais.listarPorCriador(usuarioId);
  }

  // -------------------- Fluxo de aprovação --------------------

  /** Colaborador submete um novo sinal com vídeo. Resultado: status PENDENTE. */
  async submeter(usuario: Usuario, entrada: DadosSubmissao): Promise<Sinal> {
    if (!usuario.pode(Permissao.SUBMETER_SINAL)) {
      throw new ForbiddenError('Seu papel não permite submeter sinais.');
    }
    if (!entrada.dados.palavra?.trim()) {
      throw new ValidationError('A palavra do sinal é obrigatória.');
    }
    this.validarConsentimento(entrada.midia);

    return withTransaction(async (client) => {
      const sinal = await this.sinais.criar(
        {
          ...entrada.dados,
          status: StatusSinal.PENDENTE,
          criadoPor: usuario.id,
        },
        client,
      );

      if (entrada.assuntoIds?.length) {
        await this.sinais.definirAssuntos(sinal.id, entrada.assuntoIds, client);
      }

      if (entrada.midia) {
        await this.persistirMidia(sinal.id, usuario, entrada.midia, client);
      }

      await this.auditoria.registrar(
        {
          usuarioId: usuario.id,
          acao: 'SUBMETER',
          entidade: 'sinal',
          entidadeId: sinal.id,
          detalhes: `Submissão do sinal "${sinal.palavra}" (status PENDENTE).`,
        },
        client,
      );
      return sinal;
    });
  }

  /**
   * Revisor/Admin aprova o sinal. A aprovação registra a decisão e publica o
   * sinal (PENDENTE → APROVADO → PUBLICADO), tornando-o visível ao Visitante.
   */
  async aprovar(sinalId: string, revisor: Usuario, comentario?: string): Promise<Sinal> {
    return this.decidir(sinalId, revisor, DecisaoRevisao.APROVADO, comentario);
  }

  /** Revisor/Admin rejeita o sinal (exige justificativa). Resultado: REJEITADO. */
  async rejeitar(sinalId: string, revisor: Usuario, comentario: string): Promise<Sinal> {
    if (!comentario?.trim()) {
      throw new ValidationError('A rejeição exige uma justificativa.');
    }
    return this.decidir(sinalId, revisor, DecisaoRevisao.REJEITADO, comentario);
  }

  private async decidir(
    sinalId: string,
    revisor: Usuario,
    decisao: DecisaoRevisao,
    comentario?: string,
  ): Promise<Sinal> {
    if (!revisor.pode(Permissao.APROVAR_REJEITAR_SINAL)) {
      throw new ForbiddenError('Seu papel não permite revisar sinais.');
    }
    const sinal = await this.sinais.buscarPorId(sinalId, false);
    if (!sinal) throw new NotFoundError('Sinal não encontrado.');
    if (sinal.status !== StatusSinal.PENDENTE) {
      throw new ValidationError(`Apenas sinais PENDENTES podem ser revisados (atual: ${sinal.status}).`);
    }

    return withTransaction(async (client) => {
      await this.revisoes.registrar(sinalId, revisor.id, decisao, comentario ?? null, client);

      if (decisao === DecisaoRevisao.APROVADO) {
        // Percorre a máquina de estados canônica: PENDENTE → APROVADO → PUBLICADO.
        sinal.aplicarTransicao('aprovar');
        sinal.aplicarTransicao('publicar');
      } else {
        sinal.aplicarTransicao('rejeitar');
      }

      await this.sinais.atualizarStatus(sinalId, sinal.status, revisor.id);
      await this.auditoria.registrar(
        {
          usuarioId: revisor.id,
          acao: decisao === DecisaoRevisao.APROVADO ? 'APROVAR' : 'REJEITAR',
          entidade: 'sinal',
          entidadeId: sinalId,
          detalhes: `Decisão: ${decisao}. ${comentario ?? ''}`.trim(),
        },
        client,
      );
      return sinal;
    });
  }

  // -------------------- CRUD administrativo --------------------

  /** Criação direta por Revisor/Admin (pode já nascer PUBLICADO) com vídeo opcional. */
  async criar(
    usuario: Usuario,
    dados: DadosSinal,
    assuntoIds?: string[],
    midia?: MidiaSubmissao,
  ): Promise<Sinal> {
    if (!usuario.pode(Permissao.EDITAR_SINAL)) {
      throw new ForbiddenError('Seu papel não permite criar sinais diretamente.');
    }
    if (!dados.palavra?.trim()) throw new ValidationError('A palavra do sinal é obrigatória.');
    this.validarConsentimento(midia);

    return withTransaction(async (client) => {
      const sinal = await this.sinais.criar({ ...dados, criadoPor: usuario.id }, client);
      if (assuntoIds?.length) await this.sinais.definirAssuntos(sinal.id, assuntoIds, client);
      if (midia) await this.persistirMidia(sinal.id, usuario, midia, client);
      await this.auditoria.registrar(
        { usuarioId: usuario.id, acao: 'CRIAR', entidade: 'sinal', entidadeId: sinal.id, detalhes: null },
        client,
      );
      return sinal;
    });
  }

  /** Edição por Revisor/Admin. Se `midia` for enviada, substitui o vídeo do sinal. */
  async editar(
    sinalId: string,
    usuario: Usuario,
    dados: DadosSinal,
    assuntoIds?: string[],
    midia?: MidiaSubmissao,
  ): Promise<Sinal> {
    if (!usuario.pode(Permissao.EDITAR_SINAL)) {
      throw new ForbiddenError('Seu papel não permite editar sinais.');
    }
    const atual = await this.sinais.buscarPorId(sinalId, false);
    if (!atual) throw new NotFoundError('Sinal não encontrado.');
    this.validarConsentimento(midia);

    return withTransaction(async (client) => {
      const sinal = await this.sinais.atualizar(sinalId, dados, client);
      if (assuntoIds) await this.sinais.definirAssuntos(sinalId, assuntoIds, client);
      if (midia) {
        // Substitui o vídeo atual do sinal pelo novo enviado.
        await this.sinais.removerVideosDoSinal(sinalId, client);
        await this.persistirMidia(sinalId, usuario, midia, client);
      }
      await this.auditoria.registrar(
        { usuarioId: usuario.id, acao: 'EDITAR', entidade: 'sinal', entidadeId: sinalId, detalhes: null },
        client,
      );
      return sinal!;
    });
  }

  /** Grava o vídeo/legenda do sinal e, quando aplicável, o consentimento LGPD. */
  private async persistirMidia(
    sinalId: string,
    usuario: Usuario,
    midia: MidiaSubmissao,
    client: import('pg').PoolClient,
  ): Promise<void> {
    await this.sinais.adicionarVideo(
      { sinalId },
      midia.videoUrl,
      midia.legendaUrl,
      midia.tamanhoBytes,
      client,
    );
    if (midia.contemPessoaIdentificavel) {
      await this.consentimentos.registrar(
        {
          usuarioId: usuario.id,
          sujeito: 'Pessoa retratada no vídeo do sinal',
          tipoDado: midia.contemMenor
            ? TipoDadoSensivel.VIDEO_MENOR_DE_IDADE
            : TipoDadoSensivel.VIDEO_PESSOA_IDENTIFICAVEL,
          contemMenor: midia.contemMenor,
          consentimentoConcedido: midia.consentimentoConcedido,
          baseLegal: midia.contemMenor
            ? 'Consentimento específico do responsável legal (art. 14, LGPD)'
            : 'Consentimento do titular (art. 7º, I, LGPD)',
        },
        client,
      );
    }
  }

  async excluir(sinalId: string, usuario: Usuario): Promise<void> {
    if (!usuario.pode(Permissao.EXCLUIR_SINAL)) {
      throw new ForbiddenError('Apenas o Administrador pode excluir sinais.');
    }
    const ok = await this.sinais.excluir(sinalId);
    if (!ok) throw new NotFoundError('Sinal não encontrado.');
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      acao: 'EXCLUIR',
      entidade: 'sinal',
      entidadeId: sinalId,
      detalhes: null,
    });
  }

  // -------------------- LGPD --------------------

  private validarConsentimento(midia?: MidiaSubmissao): void {
    if (!midia || !midia.contemPessoaIdentificavel) return;
    if (!midia.consentimentoConcedido) {
      throw new ValidationError(
        'É obrigatório registrar o consentimento antes de armazenar vídeo com pessoa identificável (LGPD).',
      );
    }
    // Reforço para menores: consentimento específico/verificável do responsável.
    if (midia.contemMenor && !midia.consentimentoConcedido) {
      throw new ValidationError(
        'Vídeos com menores de idade exigem consentimento específico do responsável legal (art. 14, LGPD).',
      );
    }
  }
}
