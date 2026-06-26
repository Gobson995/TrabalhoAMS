/**
 * Controller de Revisão: fila de submissões PENDENTES e decisão de
 * aprovar/rejeitar (fluxo de aprovação). Restrito a Revisor/Admin.
 */
import { Router } from 'express';
import { SinalService } from '../services/SinalService';
import { RevisaoRepository } from '../repositories/RevisaoRepository';
import { exigirLogin } from '../middlewares/auth';
import { autorizar } from '../middlewares/rbac';
import { Permissao } from '../types/rbac';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const sinalService = new SinalService();
const revisaoRepo = new RevisaoRepository();

router.use(exigirLogin, autorizar(Permissao.APROVAR_REJEITAR_SINAL));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pendentes = await sinalService.listarPendentes();
    res.render('revisao/fila', { titulo: 'Fila de aprovação', pendentes });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const sinal = await sinalService.obterDetalhe(req.params.id, req.usuario);
    const historico = await revisaoRepo.listarPorSinal(sinal.id);
    res.render('revisao/avaliar', { titulo: `Avaliar: ${sinal.palavra}`, sinal, historico });
  }),
);

router.post(
  '/:id/aprovar',
  asyncHandler(async (req, res) => {
    await sinalService.aprovar(req.params.id, req.usuario!, req.body.comentario);
    res.redirect('/revisao?ok=aprovado');
  }),
);

router.post(
  '/:id/rejeitar',
  asyncHandler(async (req, res) => {
    await sinalService.rejeitar(req.params.id, req.usuario!, req.body.comentario);
    res.redirect('/revisao?ok=rejeitado');
  }),
);

export default router;
