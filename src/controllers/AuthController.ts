/**
 * Controller de autenticação: login, registro e logout.
 * O login é protegido por rate-limit (RNF de segurança: 5 tentativas/min).
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../utils/asyncHandler';
import { env } from '../config/env';

const router = Router();
const authService = new AuthService();

const loginLimiter = rateLimit({
  windowMs: env.security.loginRateWindowMs,
  limit: env.security.loginRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas tentativas de login. Aguarde um minuto e tente novamente.',
});

router.get('/login', (req, res) => {
  res.render('login', { titulo: 'Entrar', erro: null, retorno: req.query.retorno ?? '/' });
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    const retorno = typeof req.body.retorno === 'string' ? req.body.retorno : '/';
    try {
      const usuario = await authService.autenticar(email, senha);
      req.session.usuarioId = usuario.id;
      res.redirect(retorno.startsWith('/') ? retorno : '/');
    } catch {
      res.status(401).render('login', {
        titulo: 'Entrar',
        erro: 'E-mail ou senha inválidos.',
        retorno,
      });
    }
  }),
);

router.get('/registrar', (_req, res) => {
  res.render('registrar', { titulo: 'Criar conta', erro: null });
});

router.post(
  '/registrar',
  asyncHandler(async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
      const usuario = await authService.registrar(nome, email, senha);
      req.session.usuarioId = usuario.id;
      res.redirect('/colaborador/submissoes');
    } catch (err) {
      res.status(400).render('registrar', {
        titulo: 'Criar conta',
        erro: (err as Error).message,
      });
    }
  }),
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

export default router;
