/**
 * Converte o corpo de um formulário de sinal nos dados do domínio,
 * normalizando strings vazias para null e validando os enums.
 */
import { DadosSinal } from '../repositories/SinalRepository';
import {
  ClasseGramatical,
  ClassificacaoSinal,
  OrigemSinal,
  PontoArticulacao,
  StatusSinal,
} from '../types/domain';

function vazioParaNulo(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s.length ? s : null;
}

function enumOuNulo<T extends Record<string, string>>(
  e: T,
  v: unknown,
): T[keyof T] | null {
  const s = vazioParaNulo(v);
  return s && (Object.values(e) as string[]).includes(s) ? (s as T[keyof T]) : null;
}

export function parseSinalForm(body: Record<string, unknown>): DadosSinal {
  const numeroBruto = vazioParaNulo(body.numero);
  return {
    palavra: vazioParaNulo(body.palavra) ?? '',
    numero: numeroBruto ? Number(numeroBruto) : null,
    acepcao: vazioParaNulo(body.acepcao),
    exemplo: vazioParaNulo(body.exemplo),
    exemploLibras: vazioParaNulo(body.exemploLibras),
    classeGramatical: enumOuNulo(ClasseGramatical, body.classeGramatical),
    origem: enumOuNulo(OrigemSinal, body.origem) ?? OrigemSinal.NACIONAL,
    signWriting: vazioParaNulo(body.signWriting),
    pontoArticulacao: enumOuNulo(PontoArticulacao, body.pontoArticulacao),
    configuracaoMao: vazioParaNulo(body.configuracaoMao),
    disposicaoMao: vazioParaNulo(body.disposicaoMao),
    orientacaoMao: vazioParaNulo(body.orientacaoMao),
    regiaoContato: vazioParaNulo(body.regiaoContato),
    componentesNaoManuais: vazioParaNulo(body.componentesNaoManuais),
    classificacao: enumOuNulo(ClassificacaoSinal, body.classificacao),
    // status só é considerado quando o formulário o envia (CRUD do Admin/Revisor).
    ...(enumOuNulo(StatusSinal, body.status)
      ? { status: enumOuNulo(StatusSinal, body.status) as StatusSinal }
      : {}),
  };
}

export function parseAssuntoIds(body: Record<string, unknown>): string[] {
  const raw = body.assuntoIds;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.length) return [raw];
  return [];
}
