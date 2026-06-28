# Projeto de Arquitetura — Padrão MVC

**Projeto:** Dicionário Libras+ · **Documento:** Decisão e justificativa de arquitetura
**Idioma:** pt-BR · **Versão:** 1.0

---

## 1. Decisão arquitetural

Adotamos o padrão **MVC (Model–View–Controller)** como organização principal da aplicação,
complementado por duas camadas internas no Model — **Services** (casos de uso) e **Repositories**
(acesso a dados) — para manter os controllers finos e o domínio testável.

```
Navegador ─HTTP─▶ Controller ─▶ Service (regra de negócio) ─▶ Repository ─▶ PostgreSQL
                      │                                            
                      └─────────────▶ View (EJS) ◀── dados ────────┘
```

## 2. O que cada camada faz **neste projeto**

### 2.1 Model
O Model concentra o **estado e as regras** do domínio. Subdivide-se em:
- **Domínio/Entidades** (`src/models/`, `src/types/`): classes `Usuario` e `Sinal` com regras
  encapsuladas (`Usuario.pode()`, `Sinal.aplicarTransicao()`), além das enumerações canônicas
  (`domain.ts`), da matriz **RBAC** (`rbac.ts`) e da **máquina de estados** do fluxo de aprovação
  (`workflow.ts`).
- **Services** (`src/services/`): a lógica de **caso de uso** — `AuthService`, `SinalService`
  (submeter, aprovar, rejeitar, CRUD, consentimento LGPD) e `UsuarioService`. É aqui que vivem as
  transações e as validações de negócio.
- **Repositories** (`src/repositories/`): o **acesso a dados** com SQL parametrizado sobre o
  PostgreSQL (`pg`), isolando o restante do código dos detalhes de persistência.

### 2.2 View
As **Views** são templates **EJS** (`src/views/`) renderizados no servidor: a tela de busca fiel ao
INES (`home.ejs`), o detalhe do sinal com vídeo legendado e variantes (`sinal-detalhe.ejs`), as
áreas do colaborador, do revisor e do administrador, além dos parciais reutilizáveis
(`partials/`). A View não contém regra de negócio — apenas apresentação acessível (WCAG 2.1 AA).

### 2.3 Controller
Os **Controllers** (`src/controllers/`) são `express.Router` que **orquestram** a requisição:
extraem e validam entrada, chamam o Service adequado e escolhem a View/redirecionamento. São
**finos** — não acessam o banco diretamente nem implementam regra de negócio.

## 3. Justificativas técnicas (sucesso a longo prazo)

- **Separação de responsabilidades:** apresentação (View), orquestração (Controller) e regra
  (Service/Model) evoluem de forma independente. Trocar o EJS por uma SPA, por exemplo, não afeta os
  Services.
- **Testabilidade:** com a regra isolada nos Services e o acesso a dados nos Repositories
  (injetáveis via construtor), conseguimos **testes unitários** com repositórios falsos e
  **testes de integração** ponta a ponta — a cobertura ficou acima de 80% em statements de
  services/controllers.
- **Trabalho paralelo da equipe:** as fronteiras nítidas permitiram que Frontend (View),
  Backend (Controller/Service/Repository) e Modelagem/Banco avançassem em paralelo, com baixo
  acoplamento e poucos conflitos de merge.
- **Manutenção e evolução do dicionário:** novos campos do sinal ou novos filtros entram em pontos
  previsíveis (entidade → repositório → serviço → view), reduzindo o risco de regressões.
- **Mapeamento limpo do fluxo de aprovação:** a máquina de estados (`workflow.ts`) e o `SinalService`
  expressam o fluxo "submeter → pendente → aprovar/rejeitar → publicar" de forma direta e auditável.

## 4. Trade-offs e alternativas consideradas

| Alternativa | Prós | Contras | Decisão |
|---|---|---|---|
| **MVC + Services/Repositories (escolhida)** | Simples de ensinar/defender; mapeia direto a um app web renderizado no servidor; testável. | Exige disciplina para não "engordar" controllers. | **Adotada.** |
| **Arquitetura em camadas pura** | Forte separação. | Sem o vocabulário View/Controller, menos natural para uma app web com telas. | Incorporada **dentro** do Model (Services/Repositories). |
| **Arquitetura Hexagonal (Ports & Adapters)** | Excelente isolamento de domínio; troca de infra trivial. | Sobrecarga conceitual (ports, adapters, DTOs) desproporcional ao escopo acadêmico. | Descartada por custo/benefício. |
| **MVC "fat controller" (sem services)** | Menos arquivos. | Controllers grandes, regra duplicada, difícil de testar. | Descartada. |

**Conclusão:** para um dicionário web com telas ricas, fluxo de aprovação e RBAC, o **MVC com
Services e Repositories** entrega a melhor relação entre clareza, testabilidade e velocidade de
desenvolvimento em equipe — sem a sobrecarga da arquitetura hexagonal.

## 5. Como o MVC se reflete na estrutura de pastas

```
src/
├─ models/         # Model: entidades com comportamento (Usuario, Sinal)
├─ types/          # Model: enums canônicos, RBAC e máquina de estados
├─ services/       # Model: casos de uso (regra de negócio, transações)
├─ repositories/   # Model: acesso a dados (SQL/PostgreSQL)
├─ views/          # View: templates EJS (+ partials)
├─ controllers/    # Controller: roteamento e orquestração
├─ middlewares/    # transversais: auth, RBAC, upload, erros
├─ config/         # env e pool do banco
└─ app.ts          # composição (monta middlewares + controllers + views)
```

O **Diagrama de Componentes** (`docs/02-modelagem/rendered/diagrama-componentes-mvc.png`) evidencia
essas camadas e suas dependências; o **Diagrama de Classes** mostra as classes que materializam o
MVC junto às entidades de domínio.

![Componentes MVC](02-modelagem/rendered/diagrama-componentes-mvc.png)
