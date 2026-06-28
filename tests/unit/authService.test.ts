import argon2 from 'argon2';
import { AuthService } from '../../src/services/AuthService';
import { Usuario } from '../../src/models/Usuario';
import { Papel } from '../../src/types/domain';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/utils/errors';

function fakeRepos(usuarioExistente?: Usuario) {
  const usuarios = {
    buscarPorEmail: jest.fn().mockResolvedValue(usuarioExistente ?? null),
    criar: jest.fn().mockImplementation(async (d) =>
      new Usuario({
        id: 'novo', nome: d.nome, email: d.email, senhaHash: d.senhaHash, papel: d.papel,
        ativo: true, criadoEm: new Date(), atualizadoEm: new Date(),
      }),
    ),
  };
  const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
  return { usuarios: usuarios as any, auditoria: auditoria as any };
}

describe('AuthService.registrar', () => {
  it('cria sempre um Colaborador e exige senha forte', async () => {
    const { usuarios, auditoria } = fakeRepos();
    const svc = new AuthService(usuarios, auditoria);
    const u = await svc.registrar('Ana', 'ana@x.com', 'senha1234');
    expect(u.papel).toBe(Papel.COLABORADOR);
    expect(usuarios.criar).toHaveBeenCalled();
    await expect(svc.registrar('Ana', 'ana@x.com', '123')).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejeita e-mail duplicado', async () => {
    const existente = new Usuario({
      id: '1', nome: 'X', email: 'a@a.com', senhaHash: 'h', papel: Papel.COLABORADOR,
      ativo: true, criadoEm: new Date(), atualizadoEm: new Date(),
    });
    const { usuarios, auditoria } = fakeRepos(existente);
    const svc = new AuthService(usuarios, auditoria);
    await expect(svc.registrar('X', 'a@a.com', 'senha1234')).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('AuthService.autenticar', () => {
  it('aceita senha correta e rejeita incorreta', async () => {
    const hash = await argon2.hash('Correta@123');
    const usuario = new Usuario({
      id: '1', nome: 'X', email: 'a@a.com', senhaHash: hash, papel: Papel.REVISOR,
      ativo: true, criadoEm: new Date(), atualizadoEm: new Date(),
    });
    const { usuarios, auditoria } = fakeRepos(usuario);
    const svc = new AuthService(usuarios, auditoria);

    const ok = await svc.autenticar('a@a.com', 'Correta@123');
    expect(ok.id).toBe('1');
    await expect(svc.autenticar('a@a.com', 'errada')).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejeita usuário inexistente com a mesma mensagem genérica', async () => {
    const { usuarios, auditoria } = fakeRepos();
    const svc = new AuthService(usuarios, auditoria);
    await expect(svc.autenticar('nao@existe.com', 'x')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
