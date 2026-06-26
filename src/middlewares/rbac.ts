/**
 * Middleware de autorização (RBAC) — validado SEMPRE no servidor.
 * Consulta a fonte canônica `papelPossuiPermissao` via Usuario.pode().
 */
import { NextFunction, Request, Response } from 'express';
import { Permissao } from '../types/rbac';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export function autorizar(...permissoes: Permissao[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) return next(new UnauthorizedError());
    const autorizado = permissoes.every((p) => req.usuario!.pode(p));
    if (!autorizado) return next(new ForbiddenError());
    next();
  };
}
