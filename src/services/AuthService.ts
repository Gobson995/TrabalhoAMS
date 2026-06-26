/**
 * Serviço de autenticação. Concentra hashing de senha (argon2), registro de
 * Colaborador e verificação de credenciais. (Camada de caso de uso do MVC.)
 */
import argon2 from 'argon2';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { AuditLogRepository } from '../repositories/AuditConsentRepository';
import { Usuario } from '../models/Usuario';
import { Papel } from '../types/domain';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';

export class AuthService {
  constructor(
    private readonly usuarios = new UsuarioRepository(),
    private readonly auditoria = new AuditLogRepository(),
  ) {}

  /** Registro público: sempre cria um Colaborador (nunca papéis elevados). */
  async registrar(nome: string, email: string, senha: string): Promise<Usuario> {
    if (!nome?.trim() || !email?.trim()) throw new ValidationError('Nome e e-mail são obrigatórios.');
    if (!senha || senha.length < 8)
      throw new ValidationError('A senha deve ter ao menos 8 caracteres.');

    const existente = await this.usuarios.buscarPorEmail(email);
    if (existente) throw new ConflictError('Já existe uma conta com este e-mail.');

    const senhaHash = await argon2.hash(senha);
    const usuario = await this.usuarios.criar({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senhaHash,
      papel: Papel.COLABORADOR,
    });
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      acao: 'REGISTRAR',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: 'Auto-cadastro de Colaborador.',
    });
    return usuario;
  }

  /** Verifica credenciais; lança UnauthorizedError em caso de falha. */
  async autenticar(email: string, senha: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorEmail(email ?? '');
    // Mesma mensagem genérica para e-mail inexistente ou senha incorreta (anti-enumeração).
    if (!usuario || !usuario.ativo) throw new UnauthorizedError('Credenciais inválidas.');

    const ok = await argon2.verify(usuario.senhaHash, senha ?? '');
    if (!ok) throw new UnauthorizedError('Credenciais inválidas.');

    await this.auditoria.registrar({
      usuarioId: usuario.id,
      acao: 'LOGIN',
      entidade: 'usuario',
      entidadeId: usuario.id,
      detalhes: null,
    });
    return usuario;
  }

  hashSenha(senha: string): Promise<string> {
    return argon2.hash(senha);
  }
}
