/**
 * Extrai os dados de mídia (vídeo + legenda) e de consentimento (LGPD) a partir
 * de uma requisição multipart processada pelo middleware `uploadSinal`.
 * Compartilhado pela submissão do Colaborador e pelo CRUD do Administrador.
 */
import { Request } from 'express';
import { MidiaSubmissao } from '../services/SinalService';

export function extrairMidia(req: Request): MidiaSubmissao | undefined {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const video = files?.video?.[0];
  if (!video) return undefined;
  const legenda = files?.legenda?.[0];
  return {
    videoUrl: `/uploads/videos/${video.filename}`,
    legendaUrl: legenda ? `/uploads/captions/${legenda.filename}` : null,
    tamanhoBytes: video.size,
    contemPessoaIdentificavel: req.body.contemPessoaIdentificavel === 'on',
    contemMenor: req.body.contemMenor === 'on',
    consentimentoConcedido: req.body.consentimentoConcedido === 'on',
  };
}
