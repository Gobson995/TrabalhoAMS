/**
 * Modelo de domínio Sinal (camada Model do MVC).
 * Concentra as regras do fluxo de aprovação e da visibilidade pública.
 */
import { Sinal as ISinal, StatusSinal, VarianteSinal, Video, Assunto } from '../types/domain';
import { AcaoFluxo, proximoStatus, transicaoPermitida } from '../types/workflow';
import { ConflictError } from '../utils/errors';

export class Sinal {
  // Espelha ISinal; campos mantidos públicos para simplicidade na View.
  // O `!` indica que são atribuídos via Object.assign no construtor.
  id!: string;
  palavra!: string;
  numero!: number | null;
  acepcao!: string | null;
  exemplo!: string | null;
  exemploLibras!: string | null;
  classeGramatical!: ISinal['classeGramatical'];
  origem!: ISinal['origem'];
  imagemUrl!: string | null;
  status!: StatusSinal;
  pontoArticulacao!: ISinal['pontoArticulacao'];
  configuracaoMao!: string | null;
  disposicaoMao!: string | null;
  orientacaoMao!: string | null;
  regiaoContato!: string | null;
  componentesNaoManuais!: string | null;
  classificacao!: ISinal['classificacao'];
  criadoPor!: string | null;
  revisadoPor!: string | null;
  criadoEm!: Date;
  atualizadoEm!: Date;

  // Agregados carregados sob demanda pelos repositories
  variantes: VarianteSinal[] = [];
  videos: Video[] = [];
  assuntos: Assunto[] = [];

  constructor(props: ISinal) {
    Object.assign(this, props);
  }

  /** Somente sinais publicados são visíveis ao Visitante. */
  estaPublicado(): boolean {
    return this.status === StatusSinal.PUBLICADO;
  }

  podeTransicionar(acao: AcaoFluxo): boolean {
    return transicaoPermitida(this.status, acao);
  }

  /**
   * Aplica uma transição do fluxo de aprovação, validando a máquina de estados.
   * Lança ConflictError se a transição não for permitida a partir do estado atual.
   */
  aplicarTransicao(acao: AcaoFluxo): StatusSinal {
    const proximo = proximoStatus(this.status, acao);
    if (!proximo) {
      throw new ConflictError(
        `Transição "${acao}" não permitida a partir do status ${this.status}.`,
      );
    }
    this.status = proximo;
    return proximo;
  }
}
