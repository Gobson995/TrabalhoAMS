# Descritivo de Atividades da Equipe

**Projeto:** Dicionário Libras+ · **Idioma:** pt-BR · **Versão:** 2.0

A divisão abaixo reflete **o que cada integrante efetivamente entregou**, conforme o histórico de
commits do repositório (Dias 1 a 6) e a divisão acordada da documentação final (Dia 7). Todos os
integrantes **revisam os Pull Requests uns dos outros** (gate do *Definition of Done*), o que
espalha o entendimento do projeto — importante para a apresentação presencial.

> **Contas Git ↔ integrantes:** `Gobson995` = **Gustavo Bada** · `vinikruger12` (Vinicius Moreira
> Krüger) = **Vinicius Kruger**.

---

## Gustavo Bada — Fundação, Backend e Interface
Responsável pela maior parte da implementação (`Gobson995`).
- **Dia 1 — Fundação:** estrutura e ferramentas do projeto (TypeScript, ESLint, Prettier, Jest);
  **Docker Compose** (PostgreSQL + pgAdmin); e o **modelo canônico de domínio** — enums e entidades
  (`domain.ts`), **matriz RBAC** (`rbac.ts`) e **máquina de estados** do fluxo de aprovação
  (`workflow.ts`).
- **Dias 3–4 — Backend (MVC/OOP):** classes de domínio (`Usuario`, `Sinal`) e *repositories*;
  **autenticação** (argon2 + sessão) e **autorização RBAC** no servidor; `SinalService` com o
  **fluxo de aprovação** (submeter → aprovar/rejeitar → publicar), **upload de vídeo**,
  **consentimento LGPD** e **trilha de auditoria**; *controllers* MVC e composição da aplicação.
- **Dia 5 — Interface:** *views* EJS fiéis ao layout do INES, estrutura MVC da camada de
  apresentação e base de **acessibilidade WCAG 2.1 AA**.

## Vinicius Kruger — Banco, Testes e Processo/Entrega
Responsável pelos dados, qualidade e fechamento (`vinikruger12`).
- **Dia 2 — Banco:** **migrations** (esquema completo espelhando o domínio), *runner* de
  migrations, configuração de conexão (pool `pg`, `.env`) e **seed de demonstração** (MAMÃE, PAI
  com variantes regionais, amostras de cada classificação) + geração de **legendas `.vtt`**.
- **Dia 6 — Testes:** **testes unitários** (RBAC, máquina de estados, models, `sinalForm`,
  middlewares, services) e **de integração** (busca pública, autenticação, fluxo de aprovação,
  CRUD admin, telas), com banco de teste criado automaticamente e **cobertura ≥ 70%** (55 testes).
- **Dia 7 — Processo e entrega:** **Definition of Done** (`docs/04`), este **descritivo da equipe**
  (`docs/05`), **manual do usuário/handover** (`docs/06`), **README** e a **exportação dos `.docx`**.

## Gustavo Hold — Engenharia de Requisitos
- **Dia 7 — Requisitos (`docs/01`):** tipos de usuário, **histórias de usuário** com critérios de
  aceitação, **requisitos funcionais (RF)** e **não-funcionais (RNF)** com métricas e métodos de
  verificação, **conformidade WCAG** e **LGPD**, e o **caso de uso UC-01** (“Aprovar novo sinal com
  vídeo”) no padrão Cockburn.

## Lucas K — Modelagem e Arquitetura
- **Dia 7 — Modelagem (`docs/02`):** **diagramas PlantUML** (classes, sequência, atividades +
  bônus de casos de uso e componentes) e o **script de renderização**.
- **Dia 7 — Arquitetura (`docs/03`):** documento de **arquitetura MVC** — justificativas,
  *trade-offs* e mapeamento do padrão para a estrutura de pastas/classes.

---

## Autoria por commit (histórico real do Git)

| Dia | Commit | Autor |
|---|---|---|
| 1 | `chore: estrutura inicial...` | Gustavo Bada (Gobson995) |
| 1 | `feat: infra (docker) + modelo de dominio, rbac e workflow` | Gustavo Bada |
| 2 | `feat(banco): esquema inicial (migrations) e runner` | Vinicius Kruger |
| 2 | `feat(banco): seed de demonstração (...) e legendas .vtt` | Vinicius Kruger |
| 3–4 | `feat: model, auth, rbac, services, controllers e fluxo de aprovacao` | Gustavo Bada |
| 5 | `feat(ui): interface com ejs, estrutura mvc e base de acessibilidade wcag` | Gustavo Bada |
| 6 | `test: testes unitários e de integração (...) >80% cobertura` | Vinicius Kruger |
| 7 | `docs(requisitos): ...` | Gustavo Hold |
| 7 | `docs(modelagem): ...` · `docs(arquitetura): ...` | Lucas K |
| 7 | `docs(processo): DoD + equipe` · `docs: README/manual + export` | Vinicius Kruger |

## Matriz de cobertura da rubrica

| Item da rubrica | Responsável |
|---|---|
| Fundação / Docker / domínio (RBAC, workflow) | Gustavo Bada |
| Backend OOP/MVC, Auth, RBAC, fluxo de aprovação, upload | Gustavo Bada |
| Interface fiel ao INES + acessibilidade (implementação) | Gustavo Bada |
| Banco (migrations, seed, pgAdmin) | Vinicius Kruger |
| Testes e cobertura | Vinicius Kruger |
| Definition of Done / board / README / manual | Vinicius Kruger |
| Requisitos (RF/RNF/histórias), WCAG e LGPD (documentação) | Gustavo Hold |
| Modelagem UML (diagramas) | Lucas K |
| Arquitetura MVC (documento) | Lucas K |
| Revisão de Pull Requests | Todos |
