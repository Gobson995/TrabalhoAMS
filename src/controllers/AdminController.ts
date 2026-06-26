/**
 * Controller administrativo: CRUD completo de Sinais e de Usuários, além da
 * trilha de auditoria (LGPD). Cada rota é protegida pela permissão adequada.
 */
import { Router } from 'express';
import { SinalService } from '../services/SinalService';
import { UsuarioService } from '../services/UsuarioService';
import { AssuntoRepository } from '../repositories/AssuntoRepository';
import { AuditLogRepository } from '../repositories/AuditConsentRepository';
import { exigirLogin } from '../middlewares/auth';
import { autorizar } from '../middlewares/rbac';
import { uploadSinal } from '../middlewares/upload';
import { Permissao } from '../types/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { parseSinalForm, parseAssuntoIds } from '../utils/sinalForm';
import { extrairMidia } from '../utils/midia';
import { ValidationError } from '../utils/errors';
import {
  ClasseGramatical,
  ClassificacaoSinal,
  OrigemSinal,
  Papel,
  PontoArticulacao,
  StatusSinal,
} from '../types/domain';

const router = Router();
const sinalService = new SinalService();
const usuarioService = new UsuarioService();
const assuntoRepo = new AssuntoRepository();
const auditRepo = new AuditLogRepository();

const enums = { ClasseGramatical, ClassificacaoSinal, OrigemSinal, PontoArticulacao, Papel, StatusSinal };

router.use(exigirLogin);

// ----------------------------- Painel -----------------------------
router.get(
  '/',
  autorizar(Permissao.EDITAR_SINAL),
  asyncHandler(async (_req, res) => {
    const pendentes = await sinalService.listarPendentes();
    res.render('admin/painel', { titulo: 'Administração', pendentes });
  }),
);

// ------------------------- CRUD de Sinais -------------------------
router.get(
  '/sinais',
  autorizar(Permissao.EDITAR_SINAL),
  asyncHandler(async (req, res) => {
    const sinais = await sinalService.buscarTodos({ termo: (req.query.termo as string) || '' , criterio: 'palavra' });
    res.render('admin/sinais-lista', { titulo: 'Gerenciar sinais', sinais, termo: req.query.termo ?? '' });
  }),
);

router.get(
  '/sinais/novo',
  autorizar(Permissao.EDITAR_SINAL),
  asyncHandler(async (_req, res) => {
    const assuntos = await assuntoRepo.listar();
    res.render('admin/sinal-form', { titulo: 'Novo sinal', sinal: null, assuntos, enums, erro: null });
  }),
);

router.post(
  '/sinais',
  autorizar(Permissao.EDITAR_SINAL),
  uploadSinal,
  asyncHandler(async (req, res) => {
    try {
      await sinalService.criar(
        req.usuario!,
        parseSinalForm(req.body),
        parseAssuntoIds(req.body),
        extrairMidia(req),
      );
      res.redirect('/admin/sinais?ok=criado');
    } catch (err) {
      const assuntos = await assuntoRepo.listar();
      res.status(err instanceof ValidationError ? 400 : 500).render('admin/sinal-form', {
        titulo: 'Novo sinal',
        sinal: req.body,
        assuntos,
        enums,
        erro: (err as Error).message,
      });
    }
  }),
);

router.get(
  '/sinais/:id/editar',
  autorizar(Permissao.EDITAR_SINAL),
  asyncHandler(async (req, res) => {
    const sinal = await sinalService.obterDetalhe(req.params.id, req.usuario);
    const assuntos = await assuntoRepo.listar();
    res.render('admin/sinal-form', { titulo: `Editar: ${sinal.palavra}`, sinal, assuntos, enums, erro: null });
  }),
);

router.post(
  '/sinais/:id',
  autorizar(Permissao.EDITAR_SINAL),
  uploadSinal,
  asyncHandler(async (req, res) => {
    try {
      await sinalService.editar(
        req.params.id,
        req.usuario!,
        parseSinalForm(req.body),
        parseAssuntoIds(req.body),
        extrairMidia(req),
      );
      res.redirect('/admin/sinais?ok=editado');
    } catch (err) {
      const sinal = await sinalService.obterDetalhe(req.params.id, req.usuario);
      const assuntos = await assuntoRepo.listar();
      res.status(err instanceof ValidationError ? 400 : 500).render('admin/sinal-form', {
        titulo: `Editar: ${sinal.palavra}`,
        sinal,
        assuntos,
        enums,
        erro: (err as Error).message,
      });
    }
  }),
);

router.post(
  '/sinais/:id/excluir',
  autorizar(Permissao.EXCLUIR_SINAL),
  asyncHandler(async (req, res) => {
    await sinalService.excluir(req.params.id, req.usuario!);
    res.redirect('/admin/sinais?ok=excluido');
  }),
);

// ------------------------ CRUD de Usuários ------------------------
router.get(
  '/usuarios',
  autorizar(Permissao.GERENCIAR_USUARIOS),
  asyncHandler(async (req, res) => {
    const usuarios = await usuarioService.listar(req.usuario!);
    res.render('admin/usuarios-lista', { titulo: 'Gerenciar usuários', usuarios });
  }),
);

router.get(
  '/usuarios/novo',
  autorizar(Permissao.GERENCIAR_USUARIOS),
  (_req, res) => {
    res.render('admin/usuario-form', { titulo: 'Novo usuário', alvo: null, enums, erro: null });
  },
);

router.post(
  '/usuarios',
  autorizar(Permissao.GERENCIAR_USUARIOS),
  asyncHandler(async (req, res) => {
    try {
      await usuarioService.criar(req.usuario!, {
        nome: req.body.nome,
        email: req.body.email,
        senha: req.body.senha,
        papel: req.body.papel,
      });
      res.redirect('/admin/usuarios?ok=criado');
    } catch (err) {
      res.status(400).render('admin/usuario-form', {
        titulo: 'Novo usuário',
        alvo: null,
        enums,
        erro: (err as Error).message,
      });
    }
  }),
);

router.get(
  '/usuarios/:id/editar',
  autorizar(Permissao.GERENCIAR_USUARIOS),
  asyncHandler(async (req, res) => {
    const alvo = await usuarioService.obter(req.usuario!, req.params.id);
    res.render('admin/usuario-form', { titulo: `Editar: ${alvo.nome}`, alvo: alvo.toPublic(), enums, erro: null });
  }),
);

router.post(
  '/usuarios/:id',
  autorizar(Permissao.GERENCIAR_USUARIOS),
  asyncHandler(async (req, res) => {
    try {
      await usuarioService.atualizar(req.usuario!, req.params.id, {
        nome: req.body.nome,
        email: req.body.email,
        papel: req.body.papel,
        ativo: req.body.ativo === 'on',
        senha: req.body.senha || undefined,
      });
      res.redirect('/admin/usuarios?ok=editado');
    } catch (err) {
      const alvo = await usuarioService.obter(req.usuario!, req.params.id);
      res.status(400).render('admin/usuario-form', {
        titulo: `Editar: ${alvo.nome}`,
        alvo: alvo.toPublic(),
        enums,
        erro: (err as Error).message,
      });
    }
  }),
);

router.post(
  '/usuarios/:id/excluir',
  autorizar(Permissao.GERENCIAR_USUARIOS),
  asyncHandler(async (req, res) => {
    await usuarioService.excluir(req.usuario!, req.params.id);
    res.redirect('/admin/usuarios?ok=excluido');
  }),
);

// --------------------------- Auditoria ----------------------------
router.get(
  '/auditoria',
  autorizar(Permissao.ACESSAR_DADOS_SENSIVEIS),
  asyncHandler(async (_req, res) => {
    const registros = await auditRepo.listar();
    res.render('admin/auditoria', { titulo: 'Trilha de auditoria (LGPD)', registros });
  }),
);

export default router;
