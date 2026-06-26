/**
 * Middlewares de autenticação.
 *  - carregarUsuario: hidrata req.usuario a partir da sessão (em toda requisição).
 *  - exigirLogin: bloqueia rotas que exigem autenticação.
 */
import { NextFunction, Request, Response } from 'express';
import { UsuarioRepository } from '../repositories/UsuarioRepository';
import { UnauthorizedError } from '../utils/errors';

const usuarios = new UsuarioRepository();

export async function carregarUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.session.usuarioId) {
      const usuario = await usuarios.buscarPorId(req.session.usuarioId);
      if (usuario && usuario.ativo) {
        req.usuario = usuario;
        res.locals.usuario = usuario.toPublic();
      } else {
        req.session.destroy(() => undefined);
      }
    }
    res.locals.usuario = res.locals.usuario ?? null;
    next();
  } catch (err) {
    next(err);
  }
}

export function exigirLogin(req: Request, res: Response, next: NextFunction): void {
  if (!req.usuario) {
    // Em navegação HTML, redireciona ao login preservando o destino.
    if (req.accepts('html')) {
      res.redirect(`/login?retorno=${encodeURIComponent(req.originalUrl)}`);
      return;
    }
    next(new UnauthorizedError());
    return;
  }
  next();
}
