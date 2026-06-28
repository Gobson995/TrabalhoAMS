# Desenvolvimento Colaborativo e Definition of Done (Critério de Pronto)

**Projeto:** Dicionário Libras+ · **Idioma:** pt-BR · **Versão:** 1.0

---

## 1. Ferramenta de gestão escolhida: **GitHub Projects**

Escolhemos o **GitHub Projects** (board Kanban integrado ao repositório).

**Justificativa:** é **gratuito**, vive **junto do código** (issues e pull requests viram cartões
automaticamente), e fecha cartões via mensagens de commit (`Closes #12`). Como todo o fluxo de
revisão de código já acontece em **Pull Requests** no GitHub, concentrar o planejamento na mesma
plataforma reduz troca de contexto e mantém a rastreabilidade história ↔ issue ↔ PR ↔ commit.
(O Trello seria igualmente válido e simples, mas exigiria integração externa para ligar cartões a PRs.)

## 2. O board

Colunas (Kanban):

| Coluna | Significado |
|---|---|
| **Backlog** | Tudo o que foi identificado, ainda sem priorização para a sprint. |
| **A Fazer** | Itens priorizados e prontos para serem iniciados. |
| **Em Execução** | Em desenvolvimento por um responsável (1 pessoa por cartão). |
| **Em Revisão** | PR aberto, aguardando *code review* de um colega. |
| **Concluído** | Atende ao **Definition of Done** e foi mesclado na branch principal. |

**Fluxo de trabalho:** cada **história de usuário** (doc 01) vira uma ou mais *issues*. As issues são
**criadas, atribuídas e priorizadas** no Backlog; ao iniciar, o responsável move o cartão para
*Em Execução* e cria uma **branch** (`feat/...`, `docs/...`). Ao concluir, abre um **PR** (cartão →
*Em Revisão*); após aprovação e merge, o cartão vai para *Concluído*.

## 3. Definition of Done (Critério de Pronto)

Uma tarefa só sai de **"Em Execução" → "Concluído"** quando **TODOS** os itens abaixo forem
verdadeiros:

1. **Código implementado** conforme os **critérios de aceitação** da história de usuário.
2. **Testes automáticos** cobrindo a funcionalidade, **todos passando** (`npm test`).
3. **Lint e formatação** sem erros (`npm run lint`).
4. **Revisão de código por pelo menos 1 colega** — PR **aprovado** (gate obrigatório).
5. **Documentação/README atualizados** quando aplicável.
6. **Merge na branch principal sem conflitos.**

> Critérios complementares de qualidade adotados pela equipe: cobertura de testes em
> services/controllers **≥ 70%** (RNF13) e nenhuma regressão nos testes existentes.

## 4. Exemplo de tarefas atravessando o board

Quadro real do projeto (cada entrega passou por branch + Pull Request revisado):

| Tarefa | Responsável | Em Execução | Em Revisão | Concluído |
|---|---|:--:|:--:|:--:|
| Dia 1 — Fundação (infra + domínio/RBAC/workflow) | Gustavo Bada | ✔ | PR #1 (rev. Vinicius) | ✔ |
| Dia 2 — Banco (migrations + seed) | Vinicius Kruger | ✔ | PR #2 e #3 (rev. G. Bada) | ✔ |
| Dia 3–4 — Backend (model, auth, RBAC, fluxo de aprovação) | Gustavo Bada | ✔ | PR #4 (rev. Vinicius) | ✔ |
| Dia 5 — Interface (EJS, MVC, WCAG) | Gustavo Bada | ✔ | PR #5 (rev. Lucas K) | ✔ |
| Dia 6 — Testes (unit + integração, cobertura ≥70%) | Vinicius Kruger | ✔ | PR #6 (rev. G. Hold) | ✔ |
| Dia 7 — Documentação (requisitos, modelagem, arquitetura, processo) | Hold · Lucas · Vinicius | ✔ | PR #7 (rev. mútua) | em andamento |

## 5. Política de branches e revisão (resumo)

- **Uma branch por tarefa**; commits pequenos e em **Conventional Commits** (pt-BR).
- **Todo merge** passa por **Pull Request com ≥ 1 aprovação** (item 4 do DoD).
- A branch principal permanece **sempre verde** (testes + lint).

> Detalhes do fluxo Git, exemplos de mensagens de commit e o histórico incremental estão no
> `README.md` (seção "Fluxo de trabalho Git") e no histórico do repositório.
