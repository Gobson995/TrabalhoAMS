import { UsuarioService } from '../../src/services/UsuarioService';
import { Usuario } from '../../src/models/Usuario';
import { Papel } from '../../src/types/domain';
import { ForbiddenError, ValidationError } from '../../src/utils/errors';

function usuario(id: string, papel: Papel): Usuario {
  return new Usuario({
    id, nome: 'n', email: `${id}@x.com`, senhaHash: 'h', papel, ativo: true,
    criadoEm: new Date(), atualizadoEm: new Date(),
  });
}

function fakeRepos(alvo?: Usuario) {
  const usuarios = {
    listar: jest.fn().mockResolvedValue([]),
    buscarPorId: jest.fn().mockResolvedValue(alvo ?? null),
    buscarPorEmail: jest.fn().mockResolvedValue(null),
    criar: jest.fn().mockResolvedValue(alvo),
    atualizar: jest.fn().mockResolvedValue(alvo),
    excluir: jest.fn().mockResolvedValue(true),
  };
  const auditoria = { registrar: jest.fn().mockResolvedValue(undefined) };
  return { usuarios: usuarios as any, auditoria: auditoria as any };
}

describe('UsuarioService — regras de proteção', () => {
  it('não-admin é barrado (ForbiddenError)', async () => {
    const { usuarios, auditoria } = fakeRepos();
    const svc = new UsuarioService(usuarios, auditoria);
    await expect(svc.listar(usuario('1', Papel.REVISOR))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('admin não pode rebaixar a própria conta', async () => {
    const admin = usuario('1', Papel.ADMINISTRADOR);
    const { usuarios, auditoria } = fakeRepos(admin);
    const svc = new UsuarioService(usuarios, auditoria);
    await expect(
      svc.atualizar(admin, '1', { papel: Papel.COLABORADOR }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('admin não pode excluir a própria conta', async () => {
    const admin = usuario('1', Papel.ADMINISTRADOR);
    const { usuarios, auditoria } = fakeRepos(admin);
    const svc = new UsuarioService(usuarios, auditoria);
    await expect(svc.excluir(admin, '1')).rejects.toBeInstanceOf(ValidationError);
  });

  it('criação valida senha mínima', async () => {
    const admin = usuario('1', Papel.ADMINISTRADOR);
    const { usuarios, auditoria } = fakeRepos(admin);
    const svc = new UsuarioService(usuarios, auditoria);
    await expect(
      svc.criar(admin, { nome: 'X', email: 'x@x.com', senha: '123', papel: Papel.REVISOR }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
