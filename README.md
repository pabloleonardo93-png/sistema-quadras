# Pe na Areia - Sistema de Quadras

Sistema web para apresentacao publica do clube Pe na Areia, reserva de quadras,
validacao de e-mail, pagamento via Mercado Pago e painel administrativo.

O repositorio e dividido em dois projetos principais:

- `frontend/`: aplicacao React + Vite.
- `backend/`: API REST Node.js + Express + Sequelize + PostgreSQL.

Tambem ha um `docker-compose.yml` na raiz para executar o ambiente com
PostgreSQL, backend, frontend/Nginx e WUD para acompanhar atualizacoes de
imagens Docker.

## Funcionalidades

- Site publico com apresentacao da estrutura, quadras, espaco, eventos e contato.
- Fluxo publico de reserva de quadra.
- Validacao de e-mail antes da reserva.
- Pagamento por Pix direto e cartao via checkout do Mercado Pago.
- Webhook do Mercado Pago para atualizacao de status do pagamento.
- Banner de consentimento de cookies e pagina de privacidade.
- Painel administrativo para reservas, quadras, modalidades, horarios,
  clientes, comunicados, relatorios e logs.
- Controle de envio de codigo de verificacao por e-mail com rate limit
  persistente por e-mail e por IP.

## Tecnologias

- React 19, Vite e React Router.
- Node.js 20, Express 5 e Sequelize.
- PostgreSQL.
- JWT, bcrypt, Helmet e CORS.
- Resend para envio de e-mail.
- Mercado Pago para pagamentos.
- Docker Compose, Nginx e WUD.

## Estrutura

```text
.
|-- backend/
|   |-- src/
|   |-- test/
|   |-- package.json
|   `-- README.md
|-- frontend/
|   |-- src/
|   |-- public/
|   |-- package.json
|   `-- README.md
|-- nginx/
|-- docker-compose.yml
|-- Dockerfile
`-- README.md
```

## Requisitos

- Node.js 20 ou mais recente.
- npm.
- Docker e Docker Compose, caso va rodar o ambiente completo em containers.
- PostgreSQL local ou containerizado.

## Variaveis de ambiente

Use um arquivo `.env` na raiz do projeto para configuracoes locais ou de
producao. Esse arquivo nao deve ser versionado.

Principais variaveis usadas pelo backend e pelo Docker Compose:

```env
NODE_ENV=production
CORS_ORIGIN=https://seu-dominio.com

POSTGRES_DB=sistema_quadras
POSTGRES_USER=usuario
POSTGRES_PASSWORD=senha

JWT_SECRET=chave_longa_e_segura
JWT_EXPIRES_IN=1d

ADMIN_SEED_NAME=Administrador
ADMIN_SEED_EMAIL=admin@seudominio.com
ADMIN_SEED_PASSWORD=senha_segura

APP_PUBLIC_URL=https://seu-dominio.com
API_PUBLIC_URL=https://seu-dominio.com
TRUST_PROXY_HOPS=2

MERCADO_PAGO_ACCESS_TOKEN=access_token_de_producao
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/mercadopago
MERCADO_PAGO_WEBHOOK_SECRET=segredo_do_webhook

RESEND_API_KEY=chave_do_resend
RESEND_FROM_EMAIL="Pe na Areia <reservas@seudominio.com>"
EMAIL_FROM="Pe na Areia <reservas@seudominio.com>"
RESEND_TEMPLATE_VERIFICACAO_ID=id_do_template

EMAIL_VERIFICATION_PROVIDER=resend
EMAIL_VERIFICATION_RESEND_SECONDS=60
EMAIL_VERIFICATION_RATE_WINDOW_MINUTES=60
EMAIL_VERIFICATION_MAX_SENDS_PER_EMAIL=5
EMAIL_VERIFICATION_MAX_SENDS_PER_IP=30
```

Para desenvolvimento local do frontend, `VITE_API_URL` e opcional. Por padrao,
o Vite usa `/api` e encaminha as chamadas para o backend local.

## Rodar localmente

Instale as dependencias do backend:

```bash
cd backend
npm install
```

Instale as dependencias do frontend:

```bash
cd ../frontend
npm install
```

Suba o banco de dados pela raiz, se for usar Docker:

```bash
cd ..
docker compose up -d postgres
```

Rode migrations e seeders:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

Inicie o backend:

```bash
npm run dev
```

Em outro terminal, inicie o frontend:

```bash
cd frontend
npm run dev
```

URLs locais padrao:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API: `http://localhost:3000/api`

## Docker Compose

Para rodar o ambiente completo pela raiz:

```bash
docker compose up --build
```

Servicos principais:

- `postgres`: banco PostgreSQL.
- `backend`: API Node.js.
- `frontend`: build do React servido por Nginx.
- `wud`: monitor de atualizacoes de imagens Docker.

O frontend e publicado pela porta configurada em `FRONTEND_BIND`, com padrao
`127.0.0.1:8080`.

## Scripts

Backend:

```bash
cd backend
npm run dev
npm start
npm test
npm run lint
npm run db:migrate
npm run db:seed
npm run db:reset
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

## Pagamentos

O token do Mercado Pago deve ficar somente no backend ou no `.env` usado pelo
Docker Compose. Nunca coloque o Access Token no frontend.

Fluxos principais:

- Pix direto: `POST /api/pagamentos/mercadopago/pix/criar`.
- Cartao via checkout: `POST /api/pagamentos/mercadopago/criar`.
- Webhook: `POST /api/webhooks/mercadopago`.

No painel do Mercado Pago, configure a URL de webhook de producao apontando para:

```text
https://seu-dominio.com/api/webhooks/mercadopago
```

## Validacao antes de enviar alteracoes

Backend:

```bash
cd backend
npm test
npm run lint
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Documentacao detalhada

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
