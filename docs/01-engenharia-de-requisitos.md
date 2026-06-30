# Engenharia de Requisitos — Dicionário Libras+

**Projeto:** Expansão do Dicionário da Língua Brasileira de Sinais (Libras)
**Documento:** Especificação de Requisitos de Software (ERS)
**Versão:** 1.0 · **Idioma:** Português (pt-BR)
**Equipe:** Vinicius Kruger, Gustavo Bada, Gustavo Hold, Lucas K

---

## 1. Introdução

### 1.1 Objetivo
Este documento especifica os requisitos do **Dicionário Libras+**, uma aplicação web que
expande a experiência do Dicionário da Língua Brasileira de Sinais do INES
(<https://dicionario.ines.gov.br/>). O sistema permite **pesquisar, visualizar, submeter,
revisar e administrar** sinais de Libras, com vídeo legendado, parâmetros gramaticais
e **variação linguística** (variantes regionais).

### 1.2 Escopo
O produto reproduz fielmente a tela de busca do INES (Figura 1) e a página de detalhe de um
sinal com variantes regionais (Figura 2 — sinal "Pai"), acrescentando:
- **Fluxo colaborativo de submissão e aprovação** de novos sinais com vídeo;
- **Controle de acesso por papéis** (RBAC);
- **Acessibilidade WCAG 2.1 AA** (público inclui pessoas surdas);
- **Conformidade com a LGPD** (mídia com pessoas identificáveis / menores de idade).

### 1.3 Definições
| Termo | Significado |
|---|---|
| **Sinal** | Verbete do dicionário (uma entrada lexical da Libras). |
| **Acepção** | Significado/sentido do verbete. |
| **Ponto de articulação** | Local do corpo onde o sinal é produzido. |
| **Configuração da mão** | Forma assumida pela(s) mão(s) ao produzir o sinal. |
| **Componentes não manuais** | Expressões faciais/corporais que integram o sinal. |
| **Variação linguística** | Variantes regionais de um mesmo sinal (ex.: Padrão, RJ, RS). |

---

## 2. Tipos de usuário (atores)

| Ator | Autenticado? | Descrição |
|---|---|---|
| **Visitante** | Não | Pesquisa e visualiza **apenas sinais publicados**. |
| **Colaborador** | Sim | Submete novos sinais e sugestões (com upload de vídeo); acompanha o status das próprias submissões; **não publica direto**. |
| **Revisor/Moderador** | Sim | Avalia submissões pendentes; **aprova ou rejeita** (com justificativa); pode editar antes de publicar. |
| **Administrador** | Sim | **CRUD completo** de sinais e de usuários (criar, alterar, excluir, atribuir papéis), além de tudo que os demais fazem. |

> A relação papel × permissão é formalizada na **Matriz RBAC** (seção 6) e implementada em
> `src/types/rbac.ts`, fonte canônica consultada pelo middleware de autorização.

---

## 3. Histórias de usuário

Formato: *"Como `<papel>`, quero `<objetivo>` para `<benefício>`"*, com critérios de aceitação
em **Dado/Quando/Então** (Given/When/Then).

### 3.1 Visitante
- **HU-V1 — Buscar por palavra.** Como visitante, quero buscar um sinal pelo nome da palavra
  para encontrar rapidamente seu significado em Libras.
  - *Dado* que existem sinais publicados; *Quando* eu busco por "PAI"; *Então* vejo a lista de
    resultados publicados que correspondem ao termo.
- **HU-V2 — Ver vídeo legendado.** Como visitante, quero assistir ao vídeo do sinal com legendas
  para compreender o sinal mesmo sem áudio.
  - *Dado* um sinal publicado com vídeo; *Quando* abro seu detalhe; *Então* o player exibe os
    controles e a faixa de **legendas (captions)** ativável.
- **HU-V3 — Ver variantes regionais.** Como visitante, quero ver as variantes regionais de um
  sinal para conhecer as diferenças linguísticas por região.
  - *Dado* um sinal com variantes; *Quando* abro seu detalhe; *Então* vejo cada variante
    (ex.: Padrão, RJ, RS) com vídeo e descrição.
- **HU-V4 — Não ver conteúdo não publicado.** Como visitante, quero ver **somente** conteúdo
  publicado para não ter acesso a material em revisão.
  - *Dado* um sinal `PENDENTE`; *Quando* tento acessá-lo; *Então* recebo "não encontrado" (404).

### 3.2 Colaborador
- **HU-C1 — Submeter sinal com vídeo.** Como colaborador, quero submeter um novo sinal com vídeo
  para contribuir com a expansão do dicionário.
  - *Dado* que estou autenticado; *Quando* preencho o formulário e anexo o vídeo; *Então* a
    submissão é criada com status `PENDENTE` e fica aguardando revisão.
- **HU-C2 — Acompanhar status.** Como colaborador, quero acompanhar o status das minhas
  submissões para saber se foram aprovadas ou rejeitadas.
  - *Dado* que submeti sinais; *Quando* abro "Minhas submissões"; *Então* vejo cada sinal com seu
    status atual.
- **HU-C3 — Registrar consentimento.** Como colaborador, quero declarar o consentimento da pessoa
  retratada para cumprir a LGPD ao enviar vídeos.
  - *Dado* que o vídeo contém uma pessoa identificável; *Quando* envio sem marcar o consentimento;
    *Então* a submissão é **bloqueada** com mensagem explicativa.

### 3.3 Revisor/Moderador
- **HU-R1 — Listar pendências.** Como revisor, quero ver a fila de submissões pendentes para
  priorizar minhas avaliações.
  - *Dado* sinais `PENDENTE`; *Quando* abro a "Fila de aprovação"; *Então* vejo todos eles listados.
- **HU-R2 — Aprovar e publicar.** Como revisor, quero aprovar um sinal para torná-lo visível ao
  público.
  - *Dado* um sinal `PENDENTE`; *Quando* aprovo; *Então* o status passa a `PUBLICADO`, a decisão é
    registrada e o sinal fica visível ao visitante.
- **HU-R3 — Rejeitar com justificativa.** Como revisor, quero rejeitar com justificativa para
  orientar a correção pelo autor.
  - *Dado* um sinal `PENDENTE`; *Quando* rejeito sem justificativa; *Então* a ação é recusada;
    *Quando* rejeito com justificativa; *Então* o status passa a `REJEITADO` e o comentário é salvo.

### 3.4 Administrador
- **HU-A1 — Gerenciar usuários.** Como administrador, quero criar, editar e excluir usuários e
  atribuir papéis para controlar o acesso ao sistema.
  - *Dado* que sou administrador; *Quando* crio um usuário com papel "Revisor"; *Então* ele passa a
    ter as permissões de revisor.
- **HU-A2 — CRUD de sinais.** Como administrador, quero criar, editar e excluir qualquer sinal para
  manter o dicionário correto e atualizado.
  - *Dado* um sinal existente; *Quando* o edito; *Então* as alterações são persistidas e auditadas.
- **HU-A3 — Auditoria.** Como administrador, quero consultar a trilha de auditoria para fiscalizar
  acessos e alterações de dados (LGPD).
  - *Dado* ações realizadas no sistema; *Quando* abro a auditoria; *Então* vejo quem fez o quê e quando.

---

## 4. Requisitos funcionais (RF)

Cada RF traz a **regra de negócio (RN)** associada.

| ID | Requisito | Regra de negócio |
|---|---|---|
| **RF01** | Buscar sinais por **Palavra / Exemplo / Acepção / Assunto** e por **Nº**. | Visitante só recebe sinais com status `PUBLICADO`. |
| **RF02** | Ordenar resultados (**Alfabética / Por assunto / Mão**) e filtrar por letra A–Z. | Equivalente às opções de ordenação do INES. |
| **RF03** | Visualizar o **detalhe do sinal**: acepção, exemplo, exemplo em Libras, classe gramatical, origem, imagem. | Apenas sinais publicados são exibidos ao visitante. |
| **RF04** | Reproduzir o **vídeo do sinal com legendas**. | Todo vídeo deve permitir legenda (captions); ausência é sinalizada. |
| **RF05** | Exibir **variantes regionais** (variação linguística) do sinal. | Cada variante tem região, vídeo e descrição próprios. |
| **RF06** | **Autenticação** (registro, login, logout). | Senhas armazenadas com hash (argon2); registro público cria sempre **Colaborador**. |
| **RF07** | **Autorização por papel** (RBAC) em todas as rotas protegidas. | Validação **no servidor** conforme a Matriz RBAC (seção 6). |
| **RF08** | Colaborador **submete** novo sinal com vídeo. | Submissão cria sinal em `PENDENTE`; vínculo de autoria com o colaborador. |
| **RF09** | Colaborador **acompanha** o status das próprias submissões. | Lista restrita aos sinais criados pelo próprio usuário. |
| **RF10** | Revisor/Admin **aprova** sinal. | Só `PENDENTE` pode ser aprovado; aprovação leva a `PUBLICADO` e registra `Revisao` + `AuditLog`. |
| **RF11** | Revisor/Admin **rejeita** sinal. | Rejeição **exige justificativa**; leva a `REJEITADO`. |
| **RF12** | Registrar o **fluxo de aprovação** completo (submeter → pendente → aprovar/rejeitar → publicar). | Máquina de estados em `src/types/workflow.ts`. |
| **RF13** | **CRUD de sinais** em todos os campos (gramática completa), podendo **anexar vídeo/legenda e definir o status** na criação/edição. | Inserção/alteração restrita a Revisor/Admin (com upload opcional de mídia e escolha de status); exclusão **apenas Admin**, com confirmação e remoção em cascata de vídeos/variantes. |
| **RF14** | **CRUD de usuários** e gestão de papéis. | Exclusivo do Administrador; admin não pode rebaixar/excluir a si mesmo. |
| **RF15** | **Upload, armazenamento e reprodução** de vídeo (e legenda). | Validação de tipo (MP4/WebM/OGG) e tamanho (≤ 50 MB); URL persistida no banco. |
| **RF16** | Registrar a **gramática do sinal**: parâmetros primários (ponto de articulação, configuração da mão), secundários (disposição, orientação, região de contato), componentes não manuais e classificação. | Enumerações canônicas em `src/types/domain.ts`. |
| **RF17** | Associar sinais a **Assuntos/Categorias** (N:N). | Ex.: FAMÍLIA, EDUCAÇÃO. |
| **RF18** | **Consentimento LGPD** ao enviar mídia com pessoa identificável. | Sem consentimento, o armazenamento é bloqueado; menores exigem consentimento do responsável. |
| **RF19** | **Trilha de auditoria** de ações sensíveis. | Toda criação/edição/decisão gera registro em `AuditLog`. |

---

## 5. Requisitos não-funcionais (RNF)

Cada RNF traz **métrica** e **método de verificação**.

| ID | Categoria | Requisito | Métrica | Verificação |
|---|---|---|---|---|
| **RNF01** | Usabilidade | Submeter um sinal completo sem treinamento. | < 5 min; **SUS ≥ 75**. | Teste de usabilidade com 5 usuários + questionário SUS. |
| **RNF02** | Desempenho | Busca rápida. | Resultado < **1 s** (consultas típicas). | Medição com dataset de seed; índices em `palavra`, `status`. |
| **RNF03** | Desempenho | Carregamento de página. | < **2 s**. | Lighthouse / medição manual. |
| **RNF04** | Desempenho | Upload de vídeo com feedback. | Até **50 MB** com barra de progresso. | Inspeção do `progress` em `public/js/app.js`. |
| **RNF05** | Acessibilidade | Conformidade **WCAG 2.1 AA**. | Critérios da seção 7 atendidos. | Auditoria axe/Lighthouse + checklist manual. |
| **RNF06** | Acessibilidade | **Legendas** em todos os vídeos. | 100% dos vídeos com `<track kind="captions">`. | Revisão do template `sinal-detalhe.ejs`. |
| **RNF07** | Acessibilidade | Navegação **100% por teclado** e foco visível. | Sem armadilhas de foco; contraste ≥ **4.5:1**. | Navegação só por teclado; verificador de contraste. |
| **RNF08** | Segurança | Senhas com hash. | **argon2** (ou bcrypt). | Inspeção de `AuthService`; nenhuma senha em texto puro. |
| **RNF09** | Segurança | RBAC validado no servidor. | 100% das rotas protegidas. | Testes de integração de autorização. |
| **RNF10** | Segurança | Limite de tentativas de login. | **5/min** por IP. | `express-rate-limit` no `/login`. |
| **RNF11** | Segurança | Validação de entrada em todas as rotas. | 0 inserções sem validação. | Revisão de controllers/serviços; cabeçalhos via `helmet`. |
| **RNF12** | Confiabilidade | Tratamento gracioso de erros. | Nenhuma falha não tratada derruba a app. | Middleware central de erros; `pool.on('error')`. |
| **RNF13** | Manutenibilidade | Cobertura de testes. | **≥ 70%** em serviços/controllers; lint sem erros. | `npm run test:coverage`, `npm run lint`. |
| **RNF14** | Portabilidade | Subir via Docker. | Windows/Linux/macOS. | `docker compose up` + migrations/seed. |
| **RNF15** | Privacidade | Conformidade **LGPD**. | Itens da seção 8 implementados. | Inspeção de `ConsentRecord`/`AuditLog` e do fluxo de upload. |

---

## 6. Modelo de domínio e Matriz RBAC (fonte canônica)

> Esta seção é **idêntica** ao código (`src/types/domain.ts` e `src/types/rbac.ts`), ao diagrama
> de classes e ao esquema do banco (`migrations/001_init.sql`). Qualquer divergência é um defeito.

### 6.1 Entidades principais
- **Usuario** — `id, nome, email, senhaHash, papel, ativo, criadoEm, atualizadoEm`.
- **Sinal** — `id, palavra, numero, acepcao, exemplo, exemploLibras, classeGramatical, origem,
  imagemUrl, status, pontoArticulacao, configuracaoMao, disposicaoMao, orientacaoMao,
  regiaoContato, componentesNaoManuais, classificacao, criadoPor, revisadoPor, criadoEm, atualizadoEm`.
- **VarianteSinal** — `id, sinalId, regiao, videoUrl, descricao, imagemUrl`.
- **Assunto** — `id, nome` (N:N com Sinal via `sinal_assunto`).
- **Video** — `id, sinalId, varianteId, url, legendaUrl, duracaoSeg, tamanhoBytes, criadoEm`.
- **Revisao** — `id, sinalId, revisorId, decisao, comentario, data`.
- **ConsentRecord** — `id, usuarioId, sujeito, tipoDado, contemMenor, consentimentoConcedido, dataConsentimento, baseLegal`.
- **AuditLog** — `id, usuarioId, acao, entidade, entidadeId, dataHora, detalhes`.

**Enumerações:** `Papel` (Visitante|Colaborador|Revisor|Administrador), `StatusSinal`
(RASCUNHO|PENDENTE|APROVADO|REJEITADO|PUBLICADO), `ClassificacaoSinal` (UMA_MAO|
DOIS_MOVIMENTOS_DIFERENTES|DOIS_MOVIMENTOS_IGUAIS|MOVIMENTOS_DA_FACE), `PontoArticulacao`
(Cabeça|Olhos|Peito|Cintura|Braços|Mãos), `OrigemSinal` (nacional|regional|estrangeira),
`ClasseGramatical`, `DecisaoRevisao` (APROVADO|REJEITADO).

### 6.2 Matriz RBAC

| Ação | Visitante | Colaborador | Revisor | Admin |
|---|:---:|:---:|:---:|:---:|
| Buscar/ver sinais publicados | ✔ | ✔ | ✔ | ✔ |
| Submeter novo sinal + vídeo (→ PENDENTE) | ✘ | ✔ | ✔ | ✔ |
| Ver próprias submissões e status | ✘ | ✔ | ✔ | ✔ |
| Aprovar/rejeitar/publicar sinal | ✘ | ✘ | ✔ | ✔ |
| Editar qualquer sinal/variante | ✘ | ✘ | ✔ | ✔ |
| Excluir sinal | ✘ | ✘ | ✘ | ✔ |
| CRUD de usuários e papéis | ✘ | ✘ | ✘ | ✔ |
| Acessar dados sensíveis / audit log | ✘ | ✘ | parcial¹ | ✔ |

¹ *O Revisor possui a permissão `ACESSAR_DADOS_SENSIVEIS`, porém com escopo restrito (apenas o que
diz respeito aos sinais que revisou). O Administrador tem acesso total.*

---

## 7. Conformidade WCAG 2.1 AA

Decisões concretas mapeadas aos critérios de sucesso:

| Critério WCAG | Como é atendido |
|---|---|
| **1.1.1 Conteúdo não textual** | `alt` descritivo nas imagens de configuração de mão; ícones decorativos com `aria-hidden`. |
| **1.2.2 Legendas (pré-gravado)** | Todo `<video>` recebe `<track kind="captions" srclang="pt">`; ausência de legenda é sinalizada com aviso. |
| **1.3.1 Informações e relações** | HTML semântico: `<header> <nav> <main> <aside> <table> <dl> <fieldset>/<legend>`. |
| **1.4.3 Contraste mínimo** | Paleta com contraste ≥ 4.5:1 (azul #0b4f8a sobre branco ≈ 8:1); badges de status com texto branco sobre fundo escuro. |
| **2.1.1 Teclado** | Navegação 100% por teclado; nenhum controle exige mouse. |
| **2.4.1 Ignorar blocos** | **Skip link** "Pular para o conteúdo principal" no topo de cada página. |
| **2.4.7 Foco visível** | `:focus-visible` com contorno destacado e `outline-offset`. |
| **2.3.3 Animação por interação** | `prefers-reduced-motion` desativa transições. |
| **3.3.2 Rótulos/instruções** | Todo campo de formulário possui `<label>` associado e textos de ajuda. |
| **4.1.2 Nome, função, valor** | Uso de `role`, `aria-label`, `aria-current` e `aria-live` (alertas). |

A interface é **fortemente visual e bilíngue (Libras/Português)**, com rótulos claros e ênfase
no vídeo do sinal — coerente com um público que inclui pessoas surdas.

---

## 8. Conformidade LGPD

### 8.1 Dados sensíveis identificados
- **Vídeos com pessoas identificáveis** — especialmente **vídeos de menores de idade**
  (`TipoDadoSensivel.VIDEO_MENOR_DE_IDADE`).
- **Dados cadastrais** de usuários (`DADO_CADASTRAL`): nome e e-mail.

### 8.2 Base legal e consentimento
- Captura **explícita** de consentimento antes de armazenar mídia com pessoa identificável
  (`ConsentRecord.consentimentoConcedido`), com `baseLegal` registrada (art. 7º, I, LGPD).
- **Consentimento especial e verificável para menores**: registro com `contemMenor = true` e base
  legal do art. 14 (consentimento de pelo menos um dos pais ou responsável). Submissão **sem**
  consentimento é **bloqueada** (regra em `SinalService.validarConsentimento`).

### 8.3 Políticas de descarte/retenção e direitos do titular
- **Direito de eliminação:** exclusão de sinal/variante remove em cascata seus vídeos
  (`ON DELETE CASCADE`); a exclusão de usuário é exclusiva do Administrador.
- **Acesso e correção:** o titular dos dados cadastrais pode ter seus dados consultados/corrigidos
  pelo Administrador; o colaborador acessa as próprias submissões.
- **Minimização e controle de acesso:** registros sensíveis são marcados (`tipoDado`, `contemMenor`)
  e o acesso é restrito por papel (RBAC).

### 8.4 Trilha de auditoria
- `AuditLog` registra **quem** (`usuarioId`) fez **o quê** (`acao`) em **qual entidade**
  (`entidade`, `entidadeId`) e **quando** (`dataHora`), atendendo ao princípio de
  responsabilização (*accountability*).

---

## 9. Caso de uso estruturado — UC-01: Aprovar novo sinal com vídeo

> Formato baseado no padrão de **Alistair Cockburn** (*Writing Effective Use Cases*, 2001), com
> fluxo principal, alternativos e exceções. Ver também as referências da seção 11.

| Campo | Conteúdo |
|---|---|
| **Identificador** | UC-01 |
| **Nome** | Aprovar novo sinal com vídeo |
| **Atores** | Revisor (principal), Colaborador (secundário), Administrador (alternativo) |
| **Pré-condições** | (a) Existe submissão com status `PENDENTE`; (b) o ator está autenticado com papel Revisor ou Administrador. |
| **Pós-condições (sucesso)** | O sinal está `PUBLICADO` e visível ao Visitante; há um registro em `Revisao` (APROVADO) e em `AuditLog`. |

**Fluxo principal**
1. O Revisor acessa a **Fila de aprovação**.
2. O sistema lista as submissões `PENDENTE`.
3. O Revisor seleciona uma submissão e visualiza o vídeo (com legendas) e os dados gramaticais.
4. O Revisor escolhe **Aprovar** e confirma.
5. O sistema valida a permissão (RBAC) e a transição de estado (`PENDENTE → APROVADO → PUBLICADO`).
6. O sistema registra a `Revisao` (decisão APROVADO) e a entrada de `AuditLog`.
7. O sistema altera o status para `PUBLICADO` e confirma a operação ao Revisor.

**Fluxos alternativos**
- **4a. Rejeitar:** no passo 4, o Revisor escolhe **Rejeitar** e informa a **justificativa**; o
  sistema registra `Revisao` (REJEITADO) e altera o status para `REJEITADO`; o autor é notificado
  via lista "Minhas submissões".
- **3a. Editar antes de publicar:** o Revisor/Admin pode corrigir campos do sinal antes de aprovar.

**Exceções**
- **E1 — Sem permissão:** se o ator não for Revisor/Admin, o sistema nega (HTTP 403) e encerra.
- **E2 — Estado inválido:** se o sinal não estiver `PENDENTE`, o sistema recusa a decisão
  (validação da máquina de estados).
- **E3 — Rejeição sem justificativa:** o sistema recusa e solicita o comentário obrigatório.
- **E4 — Falha de persistência:** a transação é revertida (`ROLLBACK`) e nada é alterado.

**Regras de negócio relacionadas:** RF07, RF10, RF11, RF12, RF19; RN "somente Revisor/Admin altera
o status de um sinal".

---

## 10. Rastreabilidade (resumo)

| RF | História(s) | Implementação | Teste |
|---|---|---|---|
| RF01–RF05 | HU-V1..V4 | `PublicController`, `SinalService.buscarPublicados` | `tests/integration/public.test.ts` |
| RF06–RF07 | HU-A1 | `AuthService`, `middlewares/rbac.ts` | `auth.test.ts`, `unit/rbac.test.ts` |
| RF08–RF12 | HU-C1..C3, HU-R1..R3 | `SinalService.submeter/aprovar/rejeitar` | `approval.test.ts` |
| RF13–RF14 | HU-A1, HU-A2 | `SinalService`, `UsuarioService`, `AdminController` | `admin.test.ts` |
| RF18–RF19 | HU-C3, HU-A3 | `ConsentRepository`, `AuditLogRepository` | `approval.test.ts` |

---

## 11. Referências
1. COCKBURN, A. *Writing Effective Use Cases.* Addison-Wesley, 2001.
2. W3C. *Web Content Accessibility Guidelines (WCAG) 2.1.* <https://www.w3.org/TR/WCAG21/>.
3. BRASIL. *Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).*
4. INES. *Dicionário da Língua Brasileira de Sinais.* <https://dicionario.ines.gov.br/>.
5. IEEE. *ISO/IEC/IEEE 29148:2018 — Requirements engineering.*
