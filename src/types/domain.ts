/**
 * ============================================================================
 * FONTE CANÔNICA DO MODELO DE DOMÍNIO (Dicionário Libras+)
 * ----------------------------------------------------------------------------
 * Este arquivo é a ÚNICA fonte de verdade dos nomes de entidades, campos e
 * enumerações citada no "consistency contract" do projeto. As migrations do
 * banco, os diagramas PlantUML, os documentos de requisitos e o README DEVEM
 * refletir exatamente o que está aqui. Qualquer divergência é tratada como bug.
 * ============================================================================
 */

/** Papéis de usuário (RBAC). Ver matriz em `rbac.ts`. */
export enum Papel {
  VISITANTE = 'Visitante',
  COLABORADOR = 'Colaborador',
  REVISOR = 'Revisor',
  ADMINISTRADOR = 'Administrador',
}

/** Estados do fluxo de aprovação de um sinal. */
export enum StatusSinal {
  RASCUNHO = 'RASCUNHO',
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
  PUBLICADO = 'PUBLICADO',
}

/** Classe gramatical do verbete (como no dicionário INES). */
export enum ClasseGramatical {
  SUBSTANTIVO = 'Substantivo',
  VERBO = 'Verbo',
  ADJETIVO = 'Adjetivo',
  ADVERBIO = 'Advérbio',
  PRONOME = 'Pronome',
  NUMERAL = 'Numeral',
  PREPOSICAO = 'Preposição',
  CONJUNCAO = 'Conjunção',
  INTERJEICAO = 'Interjeição',
}

/** Origem linguística do sinal. */
export enum OrigemSinal {
  NACIONAL = 'nacional',
  REGIONAL = 'regional',
  ESTRANGEIRA = 'estrangeira',
}

/** Parâmetro primário: ponto de articulação (onde o sinal é produzido). */
export enum PontoArticulacao {
  CABECA = 'Cabeça',
  OLHOS = 'Olhos',
  PEITO = 'Peito',
  CINTURA = 'Cintura',
  BRACOS = 'Braços',
  MAOS = 'Mãos',
}

/** Classificação do sinal quanto ao movimento/estrutura. */
export enum ClassificacaoSinal {
  UMA_MAO = 'UMA_MAO', // ex.: amigo
  DOIS_MOVIMENTOS_DIFERENTES = 'DOIS_MOVIMENTOS_DIFERENTES', // ex.: papel
  DOIS_MOVIMENTOS_IGUAIS = 'DOIS_MOVIMENTOS_IGUAIS', // ex.: trabalhar
  MOVIMENTOS_DA_FACE = 'MOVIMENTOS_DA_FACE', // ex.: sexo
}

/** Decisão registrada por um revisor. */
export enum DecisaoRevisao {
  APROVADO = 'APROVADO',
  REJEITADO = 'REJEITADO',
}

/** Tipos de dado tratados para fins de LGPD. */
export enum TipoDadoSensivel {
  VIDEO_PESSOA_IDENTIFICAVEL = 'VIDEO_PESSOA_IDENTIFICAVEL',
  VIDEO_MENOR_DE_IDADE = 'VIDEO_MENOR_DE_IDADE',
  DADO_CADASTRAL = 'DADO_CADASTRAL',
}

// ----------------------------------------------------------------------------
// Entidades (espelham as tabelas em /migrations).
// ----------------------------------------------------------------------------

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: Papel;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

/** Usuário sem o hash de senha — formato seguro para View/sessão. */
export type UsuarioPublico = Omit<Usuario, 'senhaHash'>;

export interface Sinal {
  id: string;
  palavra: string;
  numero: number | null;
  acepcao: string | null;
  exemplo: string | null;
  exemploLibras: string | null;
  classeGramatical: ClasseGramatical | null;
  origem: OrigemSinal;
  imagemUrl: string | null;
  signWriting: string | null;
  status: StatusSinal;
  // Parâmetros primários
  pontoArticulacao: PontoArticulacao | null;
  configuracaoMao: string | null;
  // Parâmetros secundários
  disposicaoMao: string | null;
  orientacaoMao: string | null;
  regiaoContato: string | null;
  // Componentes não manuais (expressão facial etc.)
  componentesNaoManuais: string | null;
  // Classificação do sinal
  classificacao: ClassificacaoSinal | null;
  criadoPor: string | null;
  revisadoPor: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface VarianteSinal {
  id: string;
  sinalId: string;
  regiao: string; // ex.: Padrão | RJ | RS
  videoUrl: string | null;
  descricao: string | null;
  imagemUrl: string | null;
  signWriting: string | null;
}

export interface Assunto {
  id: string;
  nome: string; // ex.: FAMÍLIA
}

export interface Video {
  id: string;
  sinalId: string | null;
  varianteId: string | null;
  url: string;
  legendaUrl: string | null; // captions (WCAG 1.2.2)
  duracaoSeg: number | null;
  tamanhoBytes: number | null;
  criadoEm: Date;
}

export interface Revisao {
  id: string;
  sinalId: string;
  revisorId: string;
  decisao: DecisaoRevisao;
  comentario: string | null;
  data: Date;
}

export interface ConsentRecord {
  id: string;
  usuarioId: string | null;
  sujeito: string | null; // titular dos dados, quando não é o próprio usuário
  tipoDado: TipoDadoSensivel;
  contemMenor: boolean;
  consentimentoConcedido: boolean;
  dataConsentimento: Date | null;
  baseLegal: string;
}

export interface AuditLog {
  id: string;
  usuarioId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  dataHora: Date;
  detalhes: string | null;
}
