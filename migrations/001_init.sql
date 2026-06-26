DO $$ BEGIN
  CREATE TYPE papel AS ENUM ('Visitante', 'Colaborador', 'Revisor', 'Administrador');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_sinal AS ENUM ('RASCUNHO', 'PENDENTE', 'APROVADO', 'REJEITADO', 'PUBLICADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE classe_gramatical AS ENUM
    ('Substantivo', 'Verbo', 'Adjetivo', 'Advérbio', 'Pronome', 'Numeral',
     'Preposição', 'Conjunção', 'Interjeição');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE origem_sinal AS ENUM ('nacional', 'regional', 'estrangeira');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ponto_articulacao AS ENUM ('Cabeça', 'Olhos', 'Peito', 'Cintura', 'Braços', 'Mãos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE classificacao_sinal AS ENUM
    ('UMA_MAO', 'DOIS_MOVIMENTOS_DIFERENTES', 'DOIS_MOVIMENTOS_IGUAIS', 'MOVIMENTOS_DA_FACE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE decisao_revisao AS ENUM ('APROVADO', 'REJEITADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_dado_sensivel AS ENUM
    ('VIDEO_PESSOA_IDENTIFICAVEL', 'VIDEO_MENOR_DE_IDADE', 'DADO_CADASTRAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


CREATE TABLE IF NOT EXISTS usuario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  senha_hash    TEXT NOT NULL,
  papel         papel NOT NULL DEFAULT 'Colaborador',
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE usuario IS 'Contas de acesso; o papel define as permissões (RBAC).';


CREATE TABLE IF NOT EXISTS sinal (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palavra                  VARCHAR(160) NOT NULL,
  numero                   INTEGER,
  acepcao                  TEXT,
  exemplo                  TEXT,
  exemplo_libras           TEXT,
  classe_gramatical        classe_gramatical,
  origem                   origem_sinal NOT NULL DEFAULT 'nacional',
  imagem_url               TEXT,
  sign_writing             TEXT,
  status                   status_sinal NOT NULL DEFAULT 'RASCUNHO',
  -- Parâmetros primários
  ponto_articulacao        ponto_articulacao,
  configuracao_mao         VARCHAR(160),
  -- Parâmetros secundários
  disposicao_mao           VARCHAR(160),
  orientacao_mao           VARCHAR(160),
  regiao_contato           VARCHAR(160),
  -- Componentes não manuais
  componentes_nao_manuais  TEXT,
  -- Classificação do sinal
  classificacao            classificacao_sinal,
  criado_por               UUID REFERENCES usuario(id) ON DELETE SET NULL,
  revisado_por             UUID REFERENCES usuario(id) ON DELETE SET NULL,
  criado_em                TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE sinal IS 'Verbete do dicionário Libras; somente status=PUBLICADO é visível ao Visitante.';
CREATE INDEX IF NOT EXISTS idx_sinal_palavra ON sinal (lower(palavra));
CREATE INDEX IF NOT EXISTS idx_sinal_status ON sinal (status);
CREATE INDEX IF NOT EXISTS idx_sinal_classificacao ON sinal (classificacao);

-- ---------------------------------------------------------------------------
-- Variante linguística (variação regional do sinal — caso "Pai")
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS variante_sinal (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinal_id      UUID NOT NULL REFERENCES sinal(id) ON DELETE CASCADE,
  regiao        VARCHAR(80) NOT NULL,
  video_url     TEXT,
  descricao     TEXT,
  imagem_url    TEXT,
  sign_writing  TEXT
);
CREATE INDEX IF NOT EXISTS idx_variante_sinal_id ON variante_sinal (sinal_id);

-- ---------------------------------------------------------------------------
-- Assunto / Categoria (N:N com Sinal)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assunto (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome  VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS sinal_assunto (
  sinal_id    UUID NOT NULL REFERENCES sinal(id) ON DELETE CASCADE,
  assunto_id  UUID NOT NULL REFERENCES assunto(id) ON DELETE CASCADE,
  PRIMARY KEY (sinal_id, assunto_id)
);

-- ---------------------------------------------------------------------------
-- Vídeo (do sinal ou de uma variante) — com legenda (captions, WCAG 1.2.2)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinal_id       UUID REFERENCES sinal(id) ON DELETE CASCADE,
  variante_id    UUID REFERENCES variante_sinal(id) ON DELETE CASCADE,
  url            TEXT NOT NULL,
  legenda_url    TEXT,
  duracao_seg    INTEGER,
  tamanho_bytes  BIGINT,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_video_alvo CHECK (sinal_id IS NOT NULL OR variante_id IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- Revisão (decisão de aprovar/rejeitar do fluxo de aprovação)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revisao (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinal_id    UUID NOT NULL REFERENCES sinal(id) ON DELETE CASCADE,
  revisor_id  UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  decisao     decisao_revisao NOT NULL,
  comentario  TEXT,
  data        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_revisao_sinal ON revisao (sinal_id);

-- ---------------------------------------------------------------------------
-- LGPD: registro de consentimento
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consent_record (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id               UUID REFERENCES usuario(id) ON DELETE SET NULL,
  sujeito                  VARCHAR(180),
  tipo_dado                tipo_dado_sensivel NOT NULL,
  contem_menor             BOOLEAN NOT NULL DEFAULT FALSE,
  consentimento_concedido  BOOLEAN NOT NULL DEFAULT FALSE,
  data_consentimento       TIMESTAMPTZ,
  base_legal               VARCHAR(200) NOT NULL
);
COMMENT ON TABLE consent_record IS 'LGPD: consentimento exigido antes de armazenar mídia com pessoa identificável.';

-- ---------------------------------------------------------------------------
-- LGPD: trilha de auditoria
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID REFERENCES usuario(id) ON DELETE SET NULL,
  acao         VARCHAR(120) NOT NULL,
  entidade     VARCHAR(80) NOT NULL,
  entidade_id  UUID,
  data_hora    TIMESTAMPTZ NOT NULL DEFAULT now(),
  detalhes     TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log (entidade, entidade_id);

-- ---------------------------------------------------------------------------
-- Gatilho: manter atualizado_em em dia
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuario_upd ON usuario;
CREATE TRIGGER trg_usuario_upd BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

DROP TRIGGER IF EXISTS trg_sinal_upd ON sinal;
CREATE TRIGGER trg_sinal_upd BEFORE UPDATE ON sinal
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
