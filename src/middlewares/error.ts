/**
 * Tratamento de erros centralizado e consistente (RNF confiabilidade).
 * Traduz AppError → status HTTP; demais erros viram 500 sem vazar detalhes.
 */
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404);
  if (req.accepts('html')) {
    res.render('error', { titulo: 'Página não encontrada', status: 404, mensagem: 'A página que você procura não existe.' });
    return;
  }
  res.json({ erro: 'NAO_ENCONTRADO', mensagem: 'Recurso não encontrado.' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const isApp = err instanceof AppError;
  const status = isApp ? err.status : 500;
  const codigo = isApp ? err.codigo : 'ERRO_INTERNO';
  const mensagem = isApp ? err.message : 'Ocorreu um erro inesperado.';

  if (!isApp || status >= 500) {
    console.error('[erro]', err);
  }

  res.status(status);
  if (req.accepts('html')) {
    res.render('error', {
      titulo: 'Erro',
      status,
      mensagem,
      detalhe: env.isProd ? null : (err as Error)?.stack,
    });
    return;
  }
  res.json({ erro: codigo, mensagem });
}
