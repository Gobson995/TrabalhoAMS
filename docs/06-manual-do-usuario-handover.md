# Manual do Usuário e Handover — Dicionário Libras+

**Documento final para o dono do projeto** · **Idioma:** pt-BR · **Versão:** 1.0

---

## 1. O que é o programa

O **Dicionário Libras+** é uma aplicação web que **expande o Dicionário da Língua Brasileira de
Sinais**. Permite **pesquisar e visualizar** sinais (com vídeo legendado, configuração de mão,
parâmetros gramaticais, SignWriting e variantes regionais) e **expandir o acervo de forma
colaborativa e moderada**: colaboradores enviam novos sinais com vídeo, revisores avaliam e
publicam.

## 2. Para quem serve

- **Pessoas surdas e ouvintes** que consultam sinais (interface visual e bilíngue, com legendas).
- **Colaboradores** (professores, intérpretes, comunidade) que contribuem com novos sinais.
- **Revisores/moderadores** que garantem a qualidade do conteúdo.
- **Administradores** que mantêm o acervo e os usuários.

## 3. Papéis de usuário

| Papel | O que pode fazer |
|---|---|
| **Visitante** | Pesquisar e ver sinais **publicados**. Não precisa de conta. |
| **Colaborador** | Tudo do Visitante + **submeter** sinais com vídeo e **acompanhar** o status. |
| **Revisor** | Tudo do Colaborador + **aprovar/rejeitar/editar** sinais. |
| **Administrador** | Tudo + **CRUD de sinais e usuários** + **auditoria**. |

---

## 4. Guia de uso passo a passo

### 4.1 Pesquisar um sinal (Visitante)
1. Acesse **http://localhost:3000**.
2. Em **Buscar por**, escolha *Palavra / Exemplo / Acepção / Assunto* e digite o termo (ou use o
   **filtro A–Z** ou a lista de **Assuntos**).
3. Clique em **Pesquisar** e selecione um resultado.
4. Na página do sinal, **assista ao vídeo** (ative as **legendas** no player) e veja acepção,
   exemplo, parâmetros e **variantes regionais** (quando houver — ex.: PAI: Padrão, RJ, RS).

### 4.2 Submeter um novo sinal com vídeo (Colaborador)
1. **Entre** (ou crie uma conta em *Criar conta*).
2. Menu **Minhas submissões → + Submeter novo sinal**.
3. Preencha os dados (palavra, acepção, parâmetros gramaticais, assuntos).
4. **Anexe o vídeo** (MP4/WebM até 50 MB) e, se possível, o **arquivo de legendas** (.vtt).
5. Se o vídeo **contém uma pessoa identificável**, marque o **consentimento (LGPD)**; para
   **menores**, marque também o campo correspondente (consentimento do responsável).
6. Clique em **Enviar para revisão** — a submissão fica com status **PENDENTE**.
7. Acompanhe o status em **Minhas submissões**.

### 4.3 Revisar e aprovar (Revisor/Administrador)
1. **Entre** como Revisor/Admin.
2. Menu **Fila de aprovação** → selecione uma submissão **PENDENTE**.
3. Assista ao vídeo e confira os parâmetros.
4. **Aprovar e publicar** (o sinal vira **PUBLICADO** e fica visível ao público) **ou**
   **Rejeitar** (informe a **justificativa** obrigatória — o sinal vira **REJEITADO** e o autor é
   avisado em "Minhas submissões").

### 4.4 Administrar (Administrador)
1. Menu **Administração**.
2. **Gerenciar sinais**: criar, editar e **excluir** qualquer sinal.
   - Ao **criar/editar**, defina o campo **Status**: somente **PUBLICADO** aparece na busca
     pública (um novo verbete já nasce como PUBLICADO por padrão para ficar visível).
   - É possível **anexar um vídeo** (e legenda .vtt) tanto na criação quanto na edição. Ao editar
     um sinal que já tem vídeo, o novo arquivo **substitui** o anterior. Marque o
     **consentimento (LGPD)** se o vídeo contiver pessoa identificável.
3. **Gerenciar usuários**: criar contas, **atribuir papéis** (Visitante/Colaborador/Revisor/Admin),
   ativar/desativar e excluir.
4. **Trilha de auditoria**: consultar quem fez o quê e quando (LGPD).

---

## 5. Como rodar localmente (resumo)

```bash
npm install
cp .env.example .env            # ajuste SESSION_SECRET (e DB_PORT, se necessário)
docker compose up -d postgres pgadmin
npm run migrate && npm run seed
npx tsx scripts/make-sample-media.ts
npm run dev                     # http://localhost:3000
```
Passo a passo completo no [README](../README.md).

### Contas de demonstração
| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@libras.gov.br` | `Admin@123` |
| Revisor | `revisor@libras.gov.br` | `Revisor@123` |
| Colaborador | `colaborador@libras.gov.br` | `Colab@123` |

---

## 6. Inspecionar o banco no pgAdmin 4

> **Credenciais locais efetivamente utilizadas neste ambiente** (definidas no `.env`; são
> credenciais de desenvolvimento da máquina local — troque-as em produção):

| Parâmetro | Valor |
|---|---|
| Host (a partir do **pgAdmin do Docker**) | `postgres` |
| Host (a partir de um cliente **no host**, ex.: DBeaver/psql) | `localhost` |
| **Porta publicada (host)** | **5433** *(alterada para evitar conflito com um PostgreSQL já instalado na máquina, que ocupava a 5432)* |
| Porta interna (rede Docker) | `5432` |
| Banco de dados | `dicionario_libras` |
| Usuário | `libras` |
| Senha | `libras_dev_password` |
| pgAdmin (web) | `http://localhost:5050` — login `admin@admin.com` / `admin` |

**Atenção:** o campo *Username* é o usuário do **banco** (`libras`), e **não** o login da tela do
pgAdmin (`admin@admin.com`). O `Host`/`Port` muda conforme onde o pgAdmin roda:

- **pgAdmin instalado na máquina (desktop):** Host `localhost`, Port **`5433`**.
- **pgAdmin do Docker (web, em http://localhost:5050):** Host `postgres`, Port **`5432`**.

**Passos (exemplo com o pgAdmin desktop):**
1. **Add New Server** → *General*: nome `Dicionário Libras`.
2. *Connection*: Host `localhost`, Port `5433`, Database `dicionario_libras`, Username `libras`,
   Password `libras_dev_password`, *Save password* ligado → **Save**.
3. Navegue em **Servers → Dicionário Libras → Databases → dicionario_libras → Schemas → public →
   Tables** e inspecione as tabelas (`usuario`, `sinal`, `variante_sinal`, `video`, `revisao`,
   `consent_record`, `audit_log`, ...). Clique com o direito em uma tabela → *View/Edit Data → All Rows*.

*(Se usar o pgAdmin do Docker em http://localhost:5050, faça login com `admin@admin.com`/`admin` e
troque apenas Host para `postgres` e Port para `5432` no passo 2.)*

---

## 7. Observações de handover

- **Segredos:** o `.env` **não é versionado**. Gere um `SESSION_SECRET` forte e troque as senhas do
  banco/pgAdmin em ambiente real.
- **Mídia de demonstração:** o repositório distribui as **legendas** (.vtt) de exemplo, mas **não**
  os vídeos `.mp4` reais (mídia de terceiros / pessoas identificáveis — ver LGPD). Faça upload de um
  vídeo pela interface (Colaborador → Submeter) para ver a reprodução completa.
- **Qualidade:** `npm test` (55 testes) e `npm run lint` devem passar limpos antes de qualquer
  publicação.
- **Próximos passos sugeridos:** notificações por e-mail ao colaborador na decisão; busca com
  acentuação/fonética; exportação de relatórios de auditoria.
