/**
 * ============================================================================
 * FLUXO DE APROVAÇÃO DO SINAL — máquina de estados canônica (consistency §1)
 * ----------------------------------------------------------------------------
 * Espelhada no diagrama de atividades e no diagrama de sequência.
 *
 *   RASCUNHO ──submeter──▶ PENDENTE ──aprovar──▶ APROVADO ──publicar──▶ PUBLICADO
 *                              │
 *                              └──rejeitar──▶ REJEITADO ──(reabrir)──▶ RASCUNHO
 *
 * Regras de negócio:
 *  - Colaborador cria em RASCUNHO e submete (→ PENDENTE).
 *  - Revisor/Admin aprovam (→ APROVADO) ou rejeitam (→ REJEITADO, exige comentário).
 *  - Publicação (→ PUBLICADO) só a partir de APROVADO; apenas PUBLICADO é visível ao Visitante.
 *  - Um sinal REJEITADO pode voltar a RASCUNHO para correção pelo autor.
 * ============================================================================
 */
import { StatusSinal } from './domain';

export type AcaoFluxo = 'submeter' | 'aprovar' | 'rejeitar' | 'publicar' | 'reabrir';

/** Transições válidas: estado atual -> ação -> próximo estado. */
export const TRANSICOES: Record<StatusSinal, Partial<Record<AcaoFluxo, StatusSinal>>> = {
  [StatusSinal.RASCUNHO]: { submeter: StatusSinal.PENDENTE },
  [StatusSinal.PENDENTE]: {
    aprovar: StatusSinal.APROVADO,
    rejeitar: StatusSinal.REJEITADO,
  },
  [StatusSinal.APROVADO]: { publicar: StatusSinal.PUBLICADO },
  [StatusSinal.REJEITADO]: { reabrir: StatusSinal.RASCUNHO },
  [StatusSinal.PUBLICADO]: {},
};

export function proximoStatus(atual: StatusSinal, acao: AcaoFluxo): StatusSinal | null {
  return TRANSICOES[atual]?.[acao] ?? null;
}

export function transicaoPermitida(atual: StatusSinal, acao: AcaoFluxo): boolean {
  return proximoStatus(atual, acao) !== null;
}
