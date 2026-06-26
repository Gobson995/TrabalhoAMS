/**
 * Controller do Colaborador: submissão de novos sinais com vídeo e
 * acompanhamento do status das próprias submissões.
 */
import { Router } from 'express';
import { SinalService } from '../services/SinalService';
import { AssuntoRepository } from '../repositories/AssuntoRepository';
import { exigirLogin } from '../middlewares/auth';
import { autorizar } from '../middlewares/rbac';
import { uploadSinal } from '../middlewares/upload';
import { Permissao } from '../types/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { parseSinalForm, parseAssuntoIds } from '../utils/sinalForm';
import { extrairMidia } from '../utils/midia';
import { ClasseGramatical, ClassificacaoSinal, OrigemSinal, PontoArticulacao } from '../types/domain';
import { ValidationError } from '../utils/errors';

const router = Router();
const sinalService = new SinalService();
const assuntoRepo = new AssuntoRepository();

router.use(exigirLogin, autorizar(Permissao.SUBMETER_SINAL));

router.get(
  '/submissoes',
  asyncHandler(async (req, res) => {
    const sinais = await sinalService.listarMinhasSubmissoes(req.usuario!.id);
    res.render('colaborador/submissoes', { titulo: 'Minhas submissões', sinais });
  }),
);

router.get(
  '/novo',
  asyncHandler(async (_req, res) => {
    const assuntos = await assuntoRepo.listar();
    res.render('colaborador/novo-sinal', {
      titulo: 'Submeter novo sinal',
      assuntos,
      enums: { ClasseGramatical, ClassificacaoSinal, OrigemSinal, PontoArticulacao },
      erro: null,
    });
  }),
);

router.post(
  '/novo',
  uploadSinal,
  asyncHandler(async (req, res) => {
    try {
      const midia = extrairMidia(req);
      if (!midia) throw new ValidationError('O vídeo do sinal é obrigatório na submissão.');

      await sinalService.submeter(req.usuario!, {
        dados: parseSinalForm(req.body),
        assuntoIds: parseAssuntoIds(req.body),
        midia,
      });
      res.redirect('/colaborador/submissoes?ok=1');
    } catch (err) {
      const assuntos = await assuntoRepo.listar();
      res.status(err instanceof ValidationError ? 400 : 500).render('colaborador/novo-sinal', {
        titulo: 'Submeter novo sinal',
        assuntos,
        enums: { ClasseGramatical, ClassificacaoSinal, OrigemSinal, PontoArticulacao },
        erro: (err as Error).message,
      });
    }
  }),
);

export default router;
