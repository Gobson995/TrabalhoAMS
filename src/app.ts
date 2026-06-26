/**
 * Composição da aplicação Express (MVC).
 * - Views: EJS (camada View) em src/views.
 * - Controllers: routers montados por área.
 * - Middlewares transversais: sessão, RBAC, segurança, erros.
 */
import path from 'node:path';
import express, { Application } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import morgan from 'morgan';
import { pool } from './config/db';
import { env } from './config/env';
import { carregarUsuario } from './middlewares/auth';
import { errorHandler, notFoundHandler } from './middlewares/error';
import { Permissao, papelPossuiPermissao } from './types/rbac';
import { Papel, StatusSinal } from './types/domain';

import publicController from './controllers/PublicController';
import authController from './controllers/AuthController';
import colaboradorController from './controllers/ColaboradorController';
import revisaoController from './controllers/RevisaoController';
import adminController from './controllers/AdminController';

export function createApp(): Application {
  const app = express();

  // ----- View engine (camada View) -----
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // ----- Segurança -----
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          mediaSrc: ["'self'"],
        },
      },
    }),
  );

  // ----- Logs (silencioso em testes) -----
  if (!env.isTest) app.use(morgan('dev'));

  // ----- Parsers -----
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // ----- Arquivos estáticos e mídia -----
  app.use('/public', express.static(path.join(process.cwd(), 'public')));
  app.use('/uploads', express.static(path.join(process.cwd(), env.upload.dir)));

  // ----- Sessão (persistida no PostgreSQL) -----
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({ pool, tableName: 'session', createTableIfMissing: true }),
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.isProd,
        maxAge: 1000 * 60 * 60 * 8, // 8h
      },
    }),
  );

  // ----- Contexto de view comum (usuário, helpers de RBAC, enums) -----
  app.use(carregarUsuario);
  app.use((req, res, next) => {
    res.locals.Permissao = Permissao;
    res.locals.Papel = Papel;
    res.locals.StatusSinal = StatusSinal;
    res.locals.urlAtual = req.originalUrl;
    res.locals.pode = (permissao: Permissao): boolean =>
      !!req.usuario && papelPossuiPermissao(req.usuario.papel, permissao);
    next();
  });

  // ----- Controllers (camada Controller) -----
  app.use('/', publicController);
  app.use('/', authController);
  app.use('/colaborador', colaboradorController);
  app.use('/revisao', revisaoController);
  app.use('/admin', adminController);

  // ----- Erros -----
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}


