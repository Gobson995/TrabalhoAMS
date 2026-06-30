# 🤟 Dicionário Libras+

Aplicação web para expansão do **Dicionário da Língua Brasileira de Sinais (Libras)**, permitindo **buscar, visualizar e cadastrar sinais**, com suporte a vídeos, descrições e variações regionais.

O projeto foi desenvolvido em equipe para a disciplina de Análise e Modelagem de Sistemas, utilizando **Node.js, TypeScript, PostgreSQL** e arquitetura **MVC**.

---

## ✨ Funcionalidades

* 🔎 **Busca de sinais** por palavra, exemplo e assunto
* 🎬 **Visualização do sinal** com vídeo, legenda e informações
* 👤 **Controle de usuários** (visitante, colaborador, revisor e administrador)
* 📤 **Envio de novos sinais**, com fluxo de aprovação
* 🛠️ **Área administrativa** para gerenciamento (CRUD)
* ♿ **Acessibilidade** baseada em WCAG
* 🔒 **Conformidade com LGPD** (consentimento de mídia)

---

## 🧱 Tecnologias utilizadas

* **Backend:** Node.js + Express
* **Linguagem:** TypeScript
* **Banco de dados:** PostgreSQL
* **Views:** EJS
* **Testes:** Jest
* **Containerização:** Docker

---

## 🏛️ Arquitetura

O projeto segue o padrão **MVC (Model-View-Controller)**:

* **Model:** dados e regras de negócio
* **View:** interface (EJS)
* **Controller:** controle das requisições

Essa separação facilita a organização e manutenção do sistema.

---

## 🚀 Como rodar o projeto

### Pré-requisitos

* Node.js
* Docker e Docker Compose

### 1. Clonar o repositório

```bash
git clone <URL-do-repositorio>
cd dicionario-libras
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

### 3. Subir o banco de dados

```bash
docker compose up -d
```

### 4. Rodar migrations e dados iniciais

```bash
npm run migrate
npm run seed
```

### 5. Iniciar a aplicação

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 👥 Usuários de teste

| Papel         | Email                                                         | Senha       |
| ------------- | ------------------------------------------------------------- | ----------- |
| Administrador | [admin@libras.gov.br](mailto:admin@libras.gov.br)             | Admin@123   |
| Revisor       | [revisor@libras.gov.br](mailto:revisor@libras.gov.br)         | Revisor@123 |
| Colaborador   | [colaborador@libras.gov.br](mailto:colaborador@libras.gov.br) | Colab@123   |

---

## 📁 Estrutura do projeto

```
src/
 ├─ controllers/   # rotas
 ├─ services/      # regras de negócio
 ├─ repositories/  # acesso ao banco
 ├─ models/        # entidades
 ├─ views/         # interface
 ├─ middlewares/   # autenticação e permissões
```

---

## 🧪 Testes

```bash
npm test
```

---

## 👨‍💻 Equipe

* Gustavo Bada
* Gustavo Holderegger
* Lucas da Silva
* Vinicius Krüger

---

## 📄 Licença

Projeto acadêmico — uso educacional.
