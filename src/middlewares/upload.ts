/**
 * Configuração de upload de mídia (multer). Valida tipo e tamanho dos arquivos
 * antes de gravá-los em disco sob uploads/ (RF de upload + RNF de desempenho).
 */
import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdirSync } from 'node:fs';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { env } from '../config/env';

const VIDEO_DIR = join(process.cwd(), env.upload.dir, 'videos');
const CAPTION_DIR = join(process.cwd(), env.upload.dir, 'captions');
[VIDEO_DIR, CAPTION_DIR].forEach((d) => mkdirSync(d, { recursive: true }));

const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const CAPTION_EXT = new Set(['.vtt', '.srt']);

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, file.fieldname === 'video' ? VIDEO_DIR : CAPTION_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  if (file.fieldname === 'video') {
    if (VIDEO_MIME.has(file.mimetype)) return cb(null, true);
    return cb(new Error('Formato de vídeo inválido. Use MP4, WebM ou OGG.'));
  }
  if (file.fieldname === 'legenda') {
    if (CAPTION_EXT.has(extname(file.originalname).toLowerCase())) return cb(null, true);
    return cb(new Error('Legenda deve ser .vtt ou .srt.'));
  }
  cb(null, false);
}

/** Aceita um vídeo + uma legenda no mesmo formulário de submissão. */
export const uploadSinal = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxVideoBytes },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'legenda', maxCount: 1 },
]);
