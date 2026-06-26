/**
 * Modelo de domínio Usuario (camada Model do MVC).
 * Encapsula os dados da entidade e as regras de negócio ligadas a permissões.
 */
import { Papel, Usuario as IUsuario, UsuarioPublico } from '../types/domain';
import { Permissao, papelPossuiPermissao } from '../types/rbac';

export class Usuario {
  readonly id: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  ativo: boolean;
  readonly criadoEm: Date;
  atualizadoEm: Date;

  constructor(props: IUsuario) {
    this.id = props.id;
    this.nome = props.nome;
    this.email = props.email;
    this.senhaHash = props.senhaHash;
    this.papel = props.papel;
    this.ativo = props.ativo;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  /** Regra central de autorização: este usuário possui a permissão? */
  pode(permissao: Permissao): boolean {
    return this.ativo && papelPossuiPermissao(this.papel, permissao);
  }

  ehAdministrador(): boolean {
    return this.papel === Papel.ADMINISTRADOR;
  }

  ehRevisorOuAdmin(): boolean {
    return this.papel === Papel.REVISOR || this.papel === Papel.ADMINISTRADOR;
  }

  /** Versão segura, sem o hash da senha — usada na View e na sessão. */
  toPublic(): UsuarioPublico {
    const { senhaHash: _omitido, ...publico } = this;
    void _omitido;
    return publico;
  }
}
