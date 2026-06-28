# Modelagem (UML em PlantUML)

Fontes `.puml` versionadas nesta pasta; imagens em `rendered/` (PNG + SVG).
Para regenerar: `npm run diagrams` (requer Java; usa o motor **Smetana**, sem GraphViz).

Todos os diagramas refletem a **fonte canônica** do projeto (`src/types/domain.ts`,
`src/types/rbac.ts`, `src/types/workflow.ts`) e o esquema do banco (`migrations/001_init.sql`).

## Diagrama de Classes (Domínio + MVC)
![Diagrama de Classes](rendered/diagrama-classes.png)

## Diagrama de Sequência — Submeter + Aprovar (publicar)
![Diagrama de Sequência](rendered/diagrama-sequencia.png)

## Diagrama de Atividades — Fluxo de aprovação
![Diagrama de Atividades](rendered/diagrama-atividades.png)

## (Bônus) Diagrama de Casos de Uso
![Diagrama de Casos de Uso](rendered/diagrama-casos-de-uso.png)

## (Bônus) Diagrama de Componentes (MVC)
![Diagrama de Componentes](rendered/diagrama-componentes-mvc.png)
