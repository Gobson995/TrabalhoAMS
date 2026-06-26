import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CAPTIONS_DIR = join(__dirname, '..', 'uploads', 'captions');
mkdirSync(CAPTIONS_DIR, { recursive: true });

const legendas: Record<string, string> = {
  mamae1: 'Sinal de MAMÃE: mão em "P" tocando o queixo.',
  'pai-padrao': 'Sinal de PAI (padrão): mão em "P" na testa.',
  'pai-rj': 'Sinal de PAI (variante RJ).',
  'pai-rs': 'Sinal de PAI (variante RS).',
  amigo: 'Sinal de AMIGO: mãos em "X" entrelaçadas.',
  papel: 'Sinal de PAPEL: dois movimentos diferentes.',
  trabalhar: 'Sinal de TRABALHAR: dois movimentos iguais com as duas mãos.',
  sexo: 'Sinal de SEXO: movimento na região da face.',
  escola: 'Sinal de ESCOLA: palmas batendo (em revisão).',
};

for (const [slug, texto] of Object.entries(legendas)) {
  const vtt = `WEBVTT\n\n00:00:00.000 --> 00:00:04.000\n${texto}\n`;
  writeFileSync(join(CAPTIONS_DIR, `${slug}.vtt`), vtt, 'utf8');
}

console.log(`[media] ${Object.keys(legendas).length} legenda(s) .vtt gerada(s) em uploads/captions.`);
