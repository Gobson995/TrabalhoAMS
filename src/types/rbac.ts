/**
 * ============================================================================
 * MATRIZ RBAC — FONTE CANÔNICA (consistency contract §1 / §6)
 * ----------------------------------------------------------------------------
 * Espelha exatamente a tabela do documento de requisitos. O middleware
 * `autorizar()` consulta `papelPossuiPermissao()` em TODA rota protegida.
 *
 * | Ação                                    | Vis | Col | Rev | Adm |
 * |-----------------------------------------|-----|-----|-----|-----|
 * | Buscar/ver sinais publicados            |  ✔  |  ✔  |  ✔  |  ✔  |
 * | Submeter novo sinal + vídeo (→PENDENTE) |  ✘  |  ✔  |  ✔  |  ✔  |
 * | Ver próprias submissões e status        |  ✘  |  ✔  |  ✔  |  ✔  |
 * | Aprovar/rejeitar/publicar sinal         |  ✘  |  ✘  |  ✔  |  ✔  |
 * | Editar qualquer sinal/variante          |  ✘  |  ✘  |  ✔  |  ✔  |
 * | Excluir sinal                           |  ✘  |  ✘  |  ✘  |  ✔  |
 * | CRUD de usuários e papéis               |  ✘  |  ✘  |  ✘  |  ✔  |
 * | Acessar dados sensíveis / audit log     |  ✘  |  ✘  | par |  ✔  |
 * ============================================================================
 */
import { Papel } from './domain';

export enum Permissao {
  BUSCAR_SINAIS_PUBLICADOS = 'BUSCAR_SINAIS_PUBLICADOS',
  SUBMETER_SINAL = 'SUBMETER_SINAL',
  VER_PROPRIAS_SUBMISSOES = 'VER_PROPRIAS_SUBMISSOES',
  APROVAR_REJEITAR_SINAL = 'APROVAR_REJEITAR_SINAL',
  EDITAR_SINAL = 'EDITAR_SINAL',
  EXCLUIR_SINAL = 'EXCLUIR_SINAL',
  GERENCIAR_USUARIOS = 'GERENCIAR_USUARIOS',
  ACESSAR_DADOS_SENSIVEIS = 'ACESSAR_DADOS_SENSIVEIS',
}

/**
 * Permissões por papel. O acesso a dados sensíveis do Revisor é "parcial":
 * a permissão é concedida, mas o serviço restringe o escopo (ele só vê o
 * audit log dos sinais que revisou). O Administrador vê tudo.
 */
export const PERMISSOES_POR_PAPEL: Record<Papel, ReadonlySet<Permissao>> = {
  [Papel.VISITANTE]: new Set([Permissao.BUSCAR_SINAIS_PUBLICADOS]),

  [Papel.COLABORADOR]: new Set([
    Permissao.BUSCAR_SINAIS_PUBLICADOS,
    Permissao.SUBMETER_SINAL,
    Permissao.VER_PROPRIAS_SUBMISSOES,
  ]),

  [Papel.REVISOR]: new Set([
    Permissao.BUSCAR_SINAIS_PUBLICADOS,
    Permissao.SUBMETER_SINAL,
    Permissao.VER_PROPRIAS_SUBMISSOES,
    Permissao.APROVAR_REJEITAR_SINAL,
    Permissao.EDITAR_SINAL,
    Permissao.ACESSAR_DADOS_SENSIVEIS, // escopo parcial (ver doc do serviço)
  ]),

  [Papel.ADMINISTRADOR]: new Set([
    Permissao.BUSCAR_SINAIS_PUBLICADOS,
    Permissao.SUBMETER_SINAL,
    Permissao.VER_PROPRIAS_SUBMISSOES,
    Permissao.APROVAR_REJEITAR_SINAL,
    Permissao.EDITAR_SINAL,
    Permissao.EXCLUIR_SINAL,
    Permissao.GERENCIAR_USUARIOS,
    Permissao.ACESSAR_DADOS_SENSIVEIS,
  ]),
};

/** Verdade booleana central consultada pelo middleware de autorização. */
export function papelPossuiPermissao(papel: Papel, permissao: Permissao): boolean {
  return PERMISSOES_POR_PAPEL[papel]?.has(permissao) ?? false;
}
