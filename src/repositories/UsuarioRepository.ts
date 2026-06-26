/**
 * Acesso a dados de Usuário (camada de persistência do Model).
 */
import { Pool } from 'pg';
import { pool as defaultPool } from '../config/db';
import { Usuario } from '../models/Usuario';
import { Papel } from '../types/domain';
import { mapUsuario } from './mappers';

export interface NovoUsuario {
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
}

export class UsuarioRepository {
  constructor(private readonly pool: Pool = defaultPool) {}

  async listar(): Promise<Usuario[]> {
    const { rows } = await this.pool.query('SELECT * FROM usuario ORDER BY nome');
    return rows.map((r) => new Usuario(mapUsuario(r)));
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query('SELECT * FROM usuario WHERE id = $1', [id]);
    return rows[0] ? new Usuario(mapUsuario(rows[0])) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query('SELECT * FROM usuario WHERE lower(email) = lower($1)', [
      email,
    ]);
    return rows[0] ? new Usuario(mapUsuario(rows[0])) : null;
  }

  async criar(dados: NovoUsuario): Promise<Usuario> {
    const { rows } = await this.pool.query(
      `INSERT INTO usuario (nome, email, senha_hash, papel)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [dados.nome, dados.email, dados.senhaHash, dados.papel],
    );
    return new Usuario(mapUsuario(rows[0]));
  }

  async atualizar(
    id: string,
    dados: Partial<{ nome: string; email: string; papel: Papel; ativo: boolean; senhaHash: string }>,
  ): Promise<Usuario | null> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let i = 1;
    const add = (coluna: string, valor: unknown) => {
      campos.push(`${coluna} = $${i++}`);
      valores.push(valor);
    };
    if (dados.nome !== undefined) add('nome', dados.nome);
    if (dados.email !== undefined) add('email', dados.email);
    if (dados.papel !== undefined) add('papel', dados.papel);
    if (dados.ativo !== undefined) add('ativo', dados.ativo);
    if (dados.senhaHash !== undefined) add('senha_hash', dados.senhaHash);
    if (campos.length === 0) return this.buscarPorId(id);

    valores.push(id);
    const { rows } = await this.pool.query(
      `UPDATE usuario SET ${campos.join(', ')} WHERE id = $${i} RETURNING *`,
      valores,
    );
    return rows[0] ? new Usuario(mapUsuario(rows[0])) : null;
  }

  async excluir(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM usuario WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}
