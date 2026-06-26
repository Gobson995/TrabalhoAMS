/**
 * Mapeamento entre linhas do banco (snake_case) e entidades do domínio (camelCase).
 * Mantém o SQL idiomático no Postgres e o TypeScript idiomático no código.
 */
import {
  Usuario,
  Sinal,
  VarianteSinal,
  Video,
  Revisao,
  Assunto,
  ConsentRecord,
  AuditLog,
} from '../types/domain';

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapUsuario = (r: any): Usuario => ({
  id: r.id,
  nome: r.nome,
  email: r.email,
  senhaHash: r.senha_hash,
  papel: r.papel,
  ativo: r.ativo,
  criadoEm: r.criado_em,
  atualizadoEm: r.atualizado_em,
});

export const mapSinal = (r: any): Sinal => ({
  id: r.id,
  palavra: r.palavra,
  numero: r.numero,
  acepcao: r.acepcao,
  exemplo: r.exemplo,
  exemploLibras: r.exemplo_libras,
  classeGramatical: r.classe_gramatical,
  origem: r.origem,
  imagemUrl: r.imagem_url,
  signWriting: r.sign_writing,
  status: r.status,
  pontoArticulacao: r.ponto_articulacao,
  configuracaoMao: r.configuracao_mao,
  disposicaoMao: r.disposicao_mao,
  orientacaoMao: r.orientacao_mao,
  regiaoContato: r.regiao_contato,
  componentesNaoManuais: r.componentes_nao_manuais,
  classificacao: r.classificacao,
  criadoPor: r.criado_por,
  revisadoPor: r.revisado_por,
  criadoEm: r.criado_em,
  atualizadoEm: r.atualizado_em,
});

export const mapVariante = (r: any): VarianteSinal => ({
  id: r.id,
  sinalId: r.sinal_id,
  regiao: r.regiao,
  videoUrl: r.video_url,
  descricao: r.descricao,
  imagemUrl: r.imagem_url,
  signWriting: r.sign_writing,
});

export const mapVideo = (r: any): Video => ({
  id: r.id,
  sinalId: r.sinal_id,
  varianteId: r.variante_id,
  url: r.url,
  legendaUrl: r.legenda_url,
  duracaoSeg: r.duracao_seg,
  tamanhoBytes: r.tamanho_bytes != null ? Number(r.tamanho_bytes) : null,
  criadoEm: r.criado_em,
});

export const mapRevisao = (r: any): Revisao => ({
  id: r.id,
  sinalId: r.sinal_id,
  revisorId: r.revisor_id,
  decisao: r.decisao,
  comentario: r.comentario,
  data: r.data,
});

export const mapAssunto = (r: any): Assunto => ({ id: r.id, nome: r.nome });

export const mapConsent = (r: any): ConsentRecord => ({
  id: r.id,
  usuarioId: r.usuario_id,
  sujeito: r.sujeito,
  tipoDado: r.tipo_dado,
  contemMenor: r.contem_menor,
  consentimentoConcedido: r.consentimento_concedido,
  dataConsentimento: r.data_consentimento,
  baseLegal: r.base_legal,
});

export const mapAuditLog = (r: any): AuditLog => ({
  id: r.id,
  usuarioId: r.usuario_id,
  acao: r.acao,
  entidade: r.entidade,
  entidadeId: r.entidade_id,
  dataHora: r.data_hora,
  detalhes: r.detalhes,
});
