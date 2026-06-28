import argon2 from 'argon2';
import { pool } from '../../src/config/db';
import { Papel, StatusSinal } from '../../src/types/domain';

export const SENHA_PADRAO = 'Senha@123';

export async function resetarBanco(): Promise<void> {
  await pool.query(`
    TRUNCATE audit_log, consent_record, revisao, video, sinal_assunto,
             variante_sinal, sinal, assunto, usuario, session RESTART IDENTITY CASCADE;
  `);
}

export async function criarUsuario(
  papel: Papel,
  email = `${papel.toLowerCase()}@teste.local`,
): Promise<{ id: string; email: string; senha: string }> {
  const senhaHash = await argon2.hash(SENHA_PADRAO);
  const { rows } = await pool.query(
    `INSERT INTO usuario (nome, email, senha_hash, papel)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [`Usuário ${papel}`, email, senhaHash, papel],
  );
  return { id: rows[0].id, email, senha: SENHA_PADRAO };
}

export async function inserirSinalPublicado(palavra: string, criadoPor?: string): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO sinal (palavra, acepcao, status, criado_por)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    [palavra, `Acepção de ${palavra}`, StatusSinal.PUBLICADO, criadoPor ?? null],
  );
  return rows[0].id;
}
