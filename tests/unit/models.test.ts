import { Usuario } from '../../src/models/Usuario';
import { Sinal } from '../../src/models/Sinal';
import { Papel, StatusSinal, OrigemSinal } from '../../src/types/domain';
import { Permissao } from '../../src/types/rbac';
import { ConflictError } from '../../src/utils/errors';

function novoUsuario(papel: Papel, ativo = true): Usuario {
  return new Usuario({
    id: 'u1', nome: 'Teste', email: 't@t.com', senhaHash: 'hash',
    papel, ativo, criadoEm: new Date(), atualizadoEm: new Date(),
  });
}

function novoSinal(status: StatusSinal): Sinal {
  return new Sinal({
    id: 's1', palavra: 'PAI', numero: 1, acepcao: null, exemplo: null, exemploLibras: null,
    classeGramatical: null, origem: OrigemSinal.NACIONAL, imagemUrl: null,
    status, pontoArticulacao: null, configuracaoMao: null, disposicaoMao: null,
    orientacaoMao: null, regiaoContato: null, componentesNaoManuais: null, classificacao: null,
    criadoPor: null, revisadoPor: null, criadoEm: new Date(), atualizadoEm: new Date(),
  });
}

describe('Modelo Usuario', () => {
  it('pode() respeita a matriz RBAC', () => {
    expect(novoUsuario(Papel.REVISOR).pode(Permissao.APROVAR_REJEITAR_SINAL)).toBe(true);
    expect(novoUsuario(Papel.COLABORADOR).pode(Permissao.EXCLUIR_SINAL)).toBe(false);
  });

  it('usuário inativo não possui permissões', () => {
    expect(novoUsuario(Papel.ADMINISTRADOR, false).pode(Permissao.GERENCIAR_USUARIOS)).toBe(false);
  });

  it('toPublic() remove o hash da senha', () => {
    const pub = novoUsuario(Papel.ADMINISTRADOR).toPublic();
    expect(pub).not.toHaveProperty('senhaHash');
    expect(pub.email).toBe('t@t.com');
  });

  it('helpers de papel', () => {
    expect(novoUsuario(Papel.ADMINISTRADOR).ehAdministrador()).toBe(true);
    expect(novoUsuario(Papel.REVISOR).ehRevisorOuAdmin()).toBe(true);
    expect(novoUsuario(Papel.COLABORADOR).ehRevisorOuAdmin()).toBe(false);
  });
});

describe('Modelo Sinal', () => {
  it('estaPublicado()', () => {
    expect(novoSinal(StatusSinal.PUBLICADO).estaPublicado()).toBe(true);
    expect(novoSinal(StatusSinal.PENDENTE).estaPublicado()).toBe(false);
  });

  it('aplicarTransicao percorre PENDENTE -> APROVADO -> PUBLICADO', () => {
    const s = novoSinal(StatusSinal.PENDENTE);
    expect(s.aplicarTransicao('aprovar')).toBe(StatusSinal.APROVADO);
    expect(s.aplicarTransicao('publicar')).toBe(StatusSinal.PUBLICADO);
  });

  it('aplicarTransicao inválida lança ConflictError', () => {
    const s = novoSinal(StatusSinal.PUBLICADO);
    expect(() => s.aplicarTransicao('aprovar')).toThrow(ConflictError);
  });
});
