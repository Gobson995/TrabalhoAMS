/**
 * Serviço de gestão de usuários (exclusivo do Administrador — RBAC).
 */
import argon2 from 'argon2';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { AuditLogRepository } from '../repositories/AuditConsentRepository';
import { Usuario } from '../models/Usuario';
import { Papel } from '../types/domain';
import { Permissao } from '../types/rbac';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

export class UsuarioService {
  constructor(
    private readonly usuarios = new UsuarioRepository(),
    private readonly auditoria = new AuditLogRepository(),
  ) {}

  private exigirAdmin(ator: Usuario): void {
    if (!ator.pode(Permissao.GERENCIAR_USUARIOS)) {
      throw new ForbiddenError('Apenas o Administrador gerencia usuários.');
    }
  }

  async listar(ator: Usuario): Promise<Usuario[]> {
    this.exigirAdmin(ator);
    return this.usuarios.listar();
  }

  async obter(ator: Usuario, id: string): Promise<Usuario> {
    this.exigirAdmin(ator);
    const u = await this.usuarios.buscarPorId(id);
    if (!u) throw new NotFoundError('Usuário não encontrado.');
    return u;
  }

  async criar(
    ator: Usuario,
    dados: { nome: string; email: string; senha: string; papel: Papel },
  ): Promise<Usuario> {
    this.exigirAdmin(ator);
    if (!dados.nome?.trim() || !dados.email?.trim())
      throw new ValidationError('Nome e e-mail são obrigatórios.');
    if (!dados.senha || dados.senha.length < 8)
      throw new ValidationError('A senha deve ter ao menos 8 caracteres.');
    if (!Object.values(Papel).includes(dados.papel))
      throw new ValidationError('Papel inválido.');

    if (await this.usuarios.buscarPorEmail(dados.email))
      throw new ConflictError('Já existe uma conta com este e-mail.');

    const senhaHash = await argon2.hash(dados.senha);
    const u = await this.usuarios.criar({
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senhaHash,
      papel: dados.papel,
    });
    await this.auditoria.registrar({
      usuarioId: ator.id,
      acao: 'CRIAR',
      entidade: 'usuario',
      entidadeId: u.id,
      detalhes: `Criado com papel ${u.papel}.`,
    });
    return u;
  }

  async atualizar(
    ator: Usuario,
    id: string,
    dados: { nome?: string; email?: string; papel?: Papel; ativo?: boolean; senha?: string },
  ): Promise<Usuario> {
    this.exigirAdmin(ator);
    const alvo = await this.usuarios.buscarPorId(id);
    if (!alvo) throw new NotFoundError('Usuário não encontrado.');

    if (dados.papel && !Object.values(Papel).includes(dados.papel))
      throw new ValidationError('Papel inválido.');
    // Trava de segurança: o admin não pode rebaixar/desativar a si mesmo.
    if (alvo.id === ator.id && (dados.papel === Papel.COLABORADOR || dados.ativo === false)) {
      throw new ValidationError('Você não pode rebaixar ou desativar a própria conta.');
    }

    const patch: Parameters<UsuarioRepository['atualizar']>[1] = {
      nome: dados.nome,
      email: dados.email?.toLowerCase(),
      papel: dados.papel,
      ativo: dados.ativo,
    };
    if (dados.senha) {
      if (dados.senha.length < 8) throw new ValidationError('A senha deve ter ao menos 8 caracteres.');
      patch.senhaHash = await argon2.hash(dados.senha);
    }
    const u = await this.usuarios.atualizar(id, patch);
    await this.auditoria.registrar({
      usuarioId: ator.id,
      acao: 'EDITAR',
      entidade: 'usuario',
      entidadeId: id,
      detalhes: null,
    });
    return u!;
  }

  async excluir(ator: Usuario, id: string): Promise<void> {
    this.exigirAdmin(ator);
    if (id === ator.id) throw new ValidationError('Você não pode excluir a própria conta.');
    const ok = await this.usuarios.excluir(id);
    if (!ok) throw new NotFoundError('Usuário não encontrado.');
    await this.auditoria.registrar({
      usuarioId: ator.id,
      acao: 'EXCLUIR',
      entidade: 'usuario',
      entidadeId: id,
      detalhes: null,
    });
  }
}
