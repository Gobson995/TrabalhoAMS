import { Papel } from '../../src/types/domain';
import { Permissao, papelPossuiPermissao } from '../../src/types/rbac';

describe('Matriz RBAC (papelPossuiPermissao)', () => {
  it('Visitante só pode buscar sinais publicados', () => {
    expect(papelPossuiPermissao(Papel.VISITANTE, Permissao.BUSCAR_SINAIS_PUBLICADOS)).toBe(true);
    expect(papelPossuiPermissao(Papel.VISITANTE, Permissao.SUBMETER_SINAL)).toBe(false);
    expect(papelPossuiPermissao(Papel.VISITANTE, Permissao.APROVAR_REJEITAR_SINAL)).toBe(false);
  });

  it('Colaborador submete e vê as próprias submissões, mas não revisa', () => {
    expect(papelPossuiPermissao(Papel.COLABORADOR, Permissao.SUBMETER_SINAL)).toBe(true);
    expect(papelPossuiPermissao(Papel.COLABORADOR, Permissao.VER_PROPRIAS_SUBMISSOES)).toBe(true);
    expect(papelPossuiPermissao(Papel.COLABORADOR, Permissao.APROVAR_REJEITAR_SINAL)).toBe(false);
    expect(papelPossuiPermissao(Papel.COLABORADOR, Permissao.EDITAR_SINAL)).toBe(false);
  });

  it('Revisor aprova/edita mas NÃO exclui nem gerencia usuários', () => {
    expect(papelPossuiPermissao(Papel.REVISOR, Permissao.APROVAR_REJEITAR_SINAL)).toBe(true);
    expect(papelPossuiPermissao(Papel.REVISOR, Permissao.EDITAR_SINAL)).toBe(true);
    expect(papelPossuiPermissao(Papel.REVISOR, Permissao.ACESSAR_DADOS_SENSIVEIS)).toBe(true);
    expect(papelPossuiPermissao(Papel.REVISOR, Permissao.EXCLUIR_SINAL)).toBe(false);
    expect(papelPossuiPermissao(Papel.REVISOR, Permissao.GERENCIAR_USUARIOS)).toBe(false);
  });

  it('Administrador possui todas as permissões', () => {
    for (const p of Object.values(Permissao)) {
      expect(papelPossuiPermissao(Papel.ADMINISTRADOR, p)).toBe(true);
    }
  });
});
