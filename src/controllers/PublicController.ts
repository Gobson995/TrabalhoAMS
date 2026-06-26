/**
 * Controller público (camada Controller do MVC): busca e visualização de sinais
 * publicados — a tela principal, fiel ao dicionário INES.
 */
import { Router } from 'express';
import { SinalService } from '../services/SinalService';
import { AssuntoRepository } from '../repositories/AssuntoRepository';
import { CriterioBusca, OrdemBusca } from '../repositories/SinalRepository';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const sinalService = new SinalService();
const assuntoRepo = new AssuntoRepository();

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const criterio = (req.query.criterio as CriterioBusca) || 'palavra';
    const termo = (req.query.termo as string) || '';
    const letra = (req.query.letra as string) || '';
    const ordem = (req.query.ordem as OrdemBusca) || 'alfabetica';
    const numero = req.query.numero ? Number(req.query.numero) : undefined;

    const [sinais, assuntos] = await Promise.all([
      sinalService.buscarPublicados({ criterio, termo, letra, ordem, numero }),
      assuntoRepo.listar(),
    ]);

    res.render('home', {
      titulo: 'Dicionário Libras+',
      sinais,
      assuntos,
      alfabeto: ALFABETO,
      filtros: { criterio, termo, letra, ordem, numero },
    });
  }),
);

router.get(
  '/sinal/:id',
  asyncHandler(async (req, res) => {
    const sinal = await sinalService.obterDetalhe(req.params.id, req.usuario);
    res.render('sinal-detalhe', { titulo: sinal.palavra, sinal });
  }),
);

router.get('/sobre', (_req, res) => {
  res.render('sobre', { titulo: 'Sobre o projeto' });
});

export default router;
