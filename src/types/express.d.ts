/**
 * Augmenta os tipos do Express/sessão para carregar o usuário autenticado.
 */
import 'express-session';
import { Usuario } from '../models/Usuario';

declare module 'express-session' {
  interface SessionData {
    usuarioId?: string;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

export {};
