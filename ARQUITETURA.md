# Arquitetura do Sistema de Quadras

Este documento descreve o estado atual do projeto Pe na Areia depois da modularizacao do frontend e dos dominios principais do backend.

## Visao Geral

O repositorio e um monorepo com:

- `frontend/`: aplicacao React + Vite.
- `backend/`: API REST Node.js + Express + Sequelize.
- `nginx/`: configuracao do Nginx usado no container frontend/gateway.
- `docker-compose.yml`: orquestracao de PostgreSQL, backend e frontend.

O frontend consome a API por `/api` por padrao. Em Docker, o Nginx serve o build do React e encaminha `/api` e `/uploads` para o backend.

## Tecnologias

Frontend:

- React 19.
- Vite 8.
- React Router 7.
- GSAP.
- Lucide React.
- ESLint.

Backend:

- Node.js com ES Modules.
- Express 5.
- Sequelize 6.
- PostgreSQL.
- JWT com `jsonwebtoken`.
- Bcrypt.
- Multer para uploads.
- Helmet e CORS.
- Resend para envio de e-mail, quando configurado.
- Test runner nativo do Node.js.
- ESLint.

Infraestrutura:

- Docker.
- Docker Compose.
- Nginx.
- PostgreSQL 16 Alpine.

## Estrutura de Pastas

Raiz:

```text
sistema-quadras/
  backend/
  frontend/
  nginx/
  docker-compose.yml
  Dockerfile
```

Backend:

```text
backend/
  src/
    app.js
    server.js
    config/
    database/
      migrations/
      seeders/
    middlewares/
    models/
    modules/
    routes/
    services/
    shared/
    utils/
  test/
  uploads/
```

Frontend:

```text
frontend/
  src/
    api/
    components/
    components/admin/
    constants/
    features/
    pages/
    routes/
    services/
    shared/
    utils/
```

## Frontend

Rotas reais declaradas em `frontend/src/routes/AppRoutes.jsx`:

- `/`
- `/reserva`
- `/reserva/dados`
- `/pagamento/retorno`
- `/admin`
- `/admin/login`
- `/admin/dashboard`
- `/admin/reservas`
- `/admin/quadras`
- `/admin/modalidades`
- `/admin/horarios`
- `/admin/clientes`
- `/admin/comunicados`
- `/admin/relatorios`

As paginas administrativas usam `React.lazy` e `Suspense`, com `PrivateRoute` nas rotas protegidas. O layout compartilhado do admin fica em `frontend/src/components/admin/AdminLayout.jsx`.

Features atuais:

- `features/admin-auth`: login administrativo.
- `features/admin-dashboard`: dashboard administrativo.
- `features/admin-reservas`: gestao de reservas.
- `features/admin-quadras`: gestao de quadras.
- `features/admin-modalidades`: gestao de modalidades.
- `features/admin-horarios`: gestao de horarios.
- `features/admin-clientes`: gestao de clientes.
- `features/admin-comunicados`: gestao de comunicados.
- `features/admin-relatorios`: relatorios.
- `features/admin-shared`: componentes e utilitarios compartilhados do admin.
- `features/booking`: fluxo modular de reserva publica.

Servicos publicos e administrativos continuam em `frontend/src/services/`, usando `frontend/src/api/api.js`. A API base vem de `VITE_API_URL` ou usa `/api`.

Constantes e formatadores compartilhados:

- `frontend/src/shared/constants/reservaStatus.js`
- `frontend/src/shared/constants/pagamentoStatus.js`
- `frontend/src/shared/constants/adminStatus.js`
- `frontend/src/shared/formatters/tempo.js`
- `frontend/src/shared/formatters/telefone.js`
- `frontend/src/shared/formatters/statusClass.js`

## Backend

O agregador principal de rotas fica em `backend/src/routes/index.js` e monta tudo sob `/api` em `backend/src/app.js`.

Modulos atuais em `backend/src/modules/`:

- `arquivos`
- `auditoria`
- `auth`
- `clientes`
- `comunicados`
- `horarios`
- `modalidades`
- `pagamentos`
- `quadras`
- `relatorios`
- `reservas`
- `verificacao-email`

O fluxo padrao dos modulos e:

```text
Route -> Validation -> Controller -> Service -> Repository -> Sequelize
```

Responsabilidades:

- Routes: URLs, middlewares, autenticacao e validacoes.
- Validations: body, params e query.
- Controllers: extraem dados de `req`, chamam services e respondem.
- Services: regras de negocio, transicoes de status, integracoes e permissoes.
- Repositories: consultas e persistencia com Sequelize.
- Models: estrutura das tabelas e associacoes.

## Pasta Shared

`backend/src/shared/` guarda codigo compartilhado real entre dominios:

- `shared/constants/reservaStatus.js`: status e grupos de status de reservas.
- `shared/constants/pagamentoStatus.js`: status e grupos de status de pagamento.
- `shared/constants/statusAdministrativos.js`: status de admin, cliente, quadra, modalidade, horario e comunicado.
- `shared/constants/verificacaoEmailStatus.js`: status da verificacao de e-mail.
- `shared/audit/registrarLog.js`: ponto central de auditoria, com sanitizacao recursiva e modo nao bloqueante por padrao.

## Banco de Dados

O backend usa Sequelize com PostgreSQL. A conexao vem de `DATABASE_URL` ou de variaveis `DB_*`/`POSTGRES_*`.

Models atuais:

- `Admin`
- `AcessoPagina`
- `Arquivo`
- `Cliente`
- `Comunicado`
- `Horario`
- `LogSistema`
- `Modalidade`
- `Quadra`
- `QuadraModalidade`
- `Reserva`
- `VerificacaoEmail`

Associacoes principais:

- `Cliente` tem muitas `Reserva`.
- `Reserva` pertence a `Cliente`, `VerificacaoEmail`, `Quadra`, `Modalidade` e `Horario`.
- `Quadra` tem muitos `Horario` e `Reserva`.
- `Horario` tem muitas `Reserva`.
- `Quadra` e `Modalidade` se relacionam por `QuadraModalidade`.
- `Admin` tem muitos `LogSistema` e `Arquivo`.

Nao existe model separado de pagamento. Os campos de pagamento ficam em `Reserva`, como `pagamentoStatus`, `mercadoPagoPreferenceId`, `mercadoPagoPaymentId`, `mercadoPagoStatus`, `pagamentoUrl`, `pagamentoCriadoEm` e `pagoEm`.

Migrations atuais:

- estrutura inicial;
- campos de pagamento em reservas;
- alinhamento de status;
- verificacao de e-mail;
- acessos de paginas.

## Endpoints

Base da API: `/api`.

Saude:

- `GET /api/health`

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`

Clientes:

- `GET /api/clientes/me`
- `POST /api/clientes`
- `GET /api/clientes`
- `GET /api/clientes/:id`
- `PUT /api/clientes/:id`
- `PATCH /api/clientes/:id/status`

Verificacao de e-mail:

- `GET /api/verificacao-email/sessao`
- `POST /api/verificacao-email/enviar`
- `POST /api/verificacao-email/confirmar`

Quadras:

- `GET /api/quadras/admin/todas`
- `GET /api/quadras`
- `GET /api/quadras/:id`
- `POST /api/quadras`
- `PUT /api/quadras/:id`
- `PATCH /api/quadras/:id/status`

Modalidades:

- `GET /api/modalidades`
- `GET /api/modalidades/:id`
- `POST /api/modalidades`
- `PUT /api/modalidades/:id`
- `PATCH /api/modalidades/:id/status`

Horarios:

- `GET /api/horarios/disponiveis`
- `GET /api/horarios`
- `POST /api/horarios`
- `PATCH /api/horarios/:id/bloquear`
- `PATCH /api/horarios/:id/liberar`

Reservas:

- `POST /api/reservas`
- `POST /api/reservas/:id/pagamento`
- `GET /api/reservas/:id/status`
- `GET /api/reservas`
- `GET /api/reservas/:id`
- `PATCH /api/reservas/:id/confirmar`
- `PATCH /api/reservas/:id/cancelar`
- `PATCH /api/reservas/:id/finalizar`

Pagamentos:

- `POST /api/pagamentos/mercadopago/criar`
- `POST /api/pagamentos/mercadopago/pix/criar`
- `POST /api/pagamentos/mercadopago/webhook`
- `POST /api/pagamentos/mercado-pago/webhook`
- `POST /api/webhooks/mercadopago`

Comunicados:

- `GET /api/comunicados/publicos`
- `POST /api/comunicados`
- `GET /api/comunicados`
- `GET /api/comunicados/:id`
- `PUT /api/comunicados/:id`
- `PATCH /api/comunicados/:id/publicar`
- `PATCH /api/comunicados/:id/arquivar`

Arquivos:

- `POST /api/arquivos/upload`
- `GET /api/arquivos`
- `DELETE /api/arquivos/:id`

Relatorios:

- `POST /api/relatorios/acessos`
- `GET /api/relatorios/dashboard`
- `GET /api/relatorios/reservas`
- `GET /api/relatorios/ocupacao`
- `GET /api/relatorios/modalidades`
- `GET /api/relatorios/acessos`

Logs:

- `GET /api/logs`
- `GET /api/logs/:id`

## Fluxo de Criacao de Reserva

Fluxo publico principal:

1. O frontend solicita ou consulta a sessao de verificacao de e-mail.
2. O cliente confirma o codigo recebido.
3. O backend retorna um token temporario e tambem usa cookie HttpOnly para a sessao de e-mail.
4. O frontend consulta quadras, modalidades e horarios disponiveis.
5. A criacao passa por `POST /api/reservas` ou pelo fluxo integrado de pagamento em `POST /api/pagamentos/mercadopago/criar` ou `POST /api/pagamentos/mercadopago/pix/criar`.
6. A rota publica usa rate limit e `validarEmailVerificado`.
7. O service valida cliente, quadra ativa, modalidade ativa, associacao quadra-modalidade, horario, data e conflito.
8. A reserva e criada em transacao com status `aguardando_pagamento` e pagamento `pendente`.
9. O horario e atualizado para `reservado`.
10. A auditoria registra `reserva_criada`.

Ha protecao contra duplicidade tanto na regra de conflito quanto no indice unico parcial de `reservas`.

## Pagamento e Webhook Mercado Pago

O dominio `pagamentos` separa:

- rotas HTTP;
- controller;
- service de pagamento;
- repository;
- provider Mercado Pago;
- service de webhook.

Fluxo de checkout:

1. O frontend envia dados da reserva ou um `reservaId` existente.
2. Rotas publicas de pagamento usam rate limit e verificacao de e-mail.
3. Para `POST /api/reservas/:id/pagamento`, o e-mail verificado precisa pertencer ao cliente da reserva.
4. O service monta a preferencia Mercado Pago ou o pagamento Pix.
5. O provider chama a API externa do Mercado Pago.
6. A reserva recebe dados como preference/payment id, URL de pagamento e prazo de expiracao.
7. A resposta publica do checkout legado nao retorna dados pessoais do cliente.

Fluxo de webhook:

1. Mercado Pago chama `/api/webhooks/mercadopago` ou aliases de compatibilidade.
2. A assinatura e validada quando ha segredo configurado.
3. Em producao, `MERCADO_PAGO_WEBHOOK_SECRET` e obrigatoria na inicializacao.
4. O webhook busca o pagamento no provider.
5. O service encontra a reserva por `external_reference`, metadata ou preference.
6. A atualizacao roda em transacao.
7. Pagamento aprovado confirma reserva; estados encerrados sem aprovacao cancelam ou expiram e liberam horario.
8. Eventos repetidos com o mesmo estado sao tratados como ja processados.

## Verificacao de E-mail

O modulo `verificacao-email` controla:

- criacao e consulta de sessao;
- envio de codigo;
- confirmacao de codigo;
- expiracao;
- limite de tentativas;
- cooldown de reenvio;
- provider `resend` ou `mock`.

O token temporario de e-mail usa `EMAIL_VERIFICATION_JWT_SECRET` ou `JWT_SECRET`. A sessao tambem pode ser enviada por cookie HttpOnly com nome configuravel por `EMAIL_VERIFICATION_COOKIE_NAME`.

## Autenticacao Administrativa

O modulo `auth` possui:

- `POST /api/auth/login`;
- `GET /api/auth/me`;
- repository de `Admin`;
- geracao de JWT;
- comparacao de senha com bcrypt;
- verificacao de administrador ativo.

O middleware `autenticarAdministrador` le o header `Authorization: Bearer`, valida o JWT com `JWT_SECRET`, busca o admin no banco e rejeita admin inexistente ou inativo.

No frontend, o token administrativo fica em `localStorage` via `frontend/src/api/api.js` e `frontend/src/services/authService.js`.

## Auditoria e Logs

O endpoint administrativo de logs esta no modulo `auditoria`:

- `GET /api/logs`
- `GET /api/logs/:id`

O ponto compartilhado `backend/src/shared/audit/registrarLog.js` sanitiza dados sensiveis de forma recursiva, trata arrays, evita recursao infinita e, por padrao, nao interrompe a operacao principal quando a auditoria falha. O modo `obrigatorio` propaga erro quando solicitado explicitamente.

A fachada `backend/src/services/logService.js` continua existindo para consumidores antigos.

## Uploads

O modulo `arquivos` usa Multer em `arquivo.upload.js`.

Caracteristicas atuais:

- campo multipart: `arquivo`;
- diretorio configurado por `UPLOAD_DIR` ou `uploads`;
- limite por `UPLOAD_MAX_SIZE` ou 5 MB;
- tipos aceitos: JPEG, PNG, WEBP e PDF;
- arquivos expostos por `/uploads`;
- Nginx encaminha `/uploads/` para o backend;
- rotas administrativas exigem autenticacao.

## Rate Limiting

O middleware `backend/src/middlewares/rateLimitMiddleware.js` implementa rate limit em memoria por IP.

Rotas sensiveis com limite:

- `POST /api/relatorios/acessos`
- `POST /api/verificacao-email/enviar`
- `POST /api/verificacao-email/confirmar`
- `POST /api/reservas`
- `POST /api/reservas/:id/pagamento`
- `POST /api/pagamentos/mercadopago/criar`
- `POST /api/pagamentos/mercadopago/pix/criar`
- `POST /api/auth/login`

O backend configura `trust proxy` via `TRUST_PROXY`. No `docker-compose.yml`, o backend recebe `TRUST_PROXY` com padrao `1` para funcionar atras do Nginx.

## Variaveis de Ambiente Importantes

Nao versionar valores reais.

Aplicacao e rede:

- `NODE_ENV`
- `PORT`
- `TRUST_PROXY`
- `CORS_ORIGIN`
- `APP_PUBLIC_URL`
- `API_PUBLIC_URL`
- `VITE_API_URL`

Banco:

- `DATABASE_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Admin e JWT:

- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `ADMIN_SEED_NAME`
- `ADMIN_SEED_EMAIL`
- `ADMIN_SEED_PASSWORD`

Uploads:

- `UPLOAD_DIR`
- `UPLOAD_MAX_SIZE`

Mercado Pago:

- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_URL`
- `MERCADO_PAGO_WEBHOOK_SECRET`

E-mail:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `EMAIL_FROM`
- `RESEND_TEMPLATE_VERIFICACAO_ID`
- `EMAIL_VERIFICATION_PROVIDER`
- `EMAIL_VERIFICATION_SECRET`
- `EMAIL_VERIFICATION_JWT_SECRET`
- `EMAIL_VERIFICATION_COOKIE_NAME`
- `EMAIL_VERIFICATION_COOKIE_SECURE`
- `CODIGO_VERIFICACAO_EXPIRACAO_MINUTOS`
- `EMAIL_VERIFICATION_CODE_TTL_MINUTES`
- `EMAIL_VERIFICATION_RESEND_SECONDS`
- `EMAIL_VERIFICATION_MAX_ATTEMPTS`
- `EMAIL_VERIFICATION_RATE_WINDOW_MINUTES`
- `EMAIL_VERIFICATION_MAX_SENDS_PER_EMAIL`
- `EMAIL_VERIFICATION_MAX_SENDS_PER_IP`
- `EMAIL_VERIFICATION_SESSION_DAYS`
- `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES`

Rate limit:

- `RATE_LIMIT_ANALYTICS_WINDOW_MS`
- `RATE_LIMIT_ANALYTICS_MAX`
- `RATE_LIMIT_EMAIL_SEND_WINDOW_MS`
- `RATE_LIMIT_EMAIL_SEND_MAX`
- `RATE_LIMIT_EMAIL_CONFIRM_WINDOW_MS`
- `RATE_LIMIT_EMAIL_CONFIRM_MAX`
- `RATE_LIMIT_RESERVA_WINDOW_MS`
- `RATE_LIMIT_RESERVA_MAX`
- `RATE_LIMIT_PAGAMENTO_WINDOW_MS`
- `RATE_LIMIT_PAGAMENTO_MAX`
- `RATE_LIMIT_LOGIN_WINDOW_MS`
- `RATE_LIMIT_LOGIN_MAX`

Outros limites:

- `CLIENTE_DADOS_RATE_WINDOW_MINUTES`
- `CLIENTE_DADOS_MAX_ATTEMPTS_PER_EMAIL`
- `CLIENTE_DADOS_MAX_ATTEMPTS_PER_PHONE`
- `CLIENTE_DADOS_MAX_ATTEMPTS_PER_IP`
- `RESERVA_PAGAMENTO_TEMPO_MINUTOS`
- `RESERVA_EXPIRACAO_INTERVALO_MS`
- `DB_LOGGING`

## Docker, Compose e Nginx

`docker-compose.yml` sobe:

- `postgres`: PostgreSQL 16 Alpine com volume `postgres_data`.
- `backend`: build de `./backend`, executa migrations, seeders e `npm start`.
- `frontend`: build da raiz via `Dockerfile`, exposto em `${FRONTEND_BIND:-127.0.0.1:8080}:80`.

Volumes:

- `postgres_data`
- `backend_uploads`

Nginx:

- `nginx/nginx.conf` serve o build do frontend.
- `/api/` e `/uploads/` sao encaminhados para `http://backend:3000`.
- `/assets/` usa cache imutavel.
- demais rotas usam fallback para `index.html`.
- `nginx/vps-app.example.conf` mostra exemplo de proxy HTTPS na VPS para o container do frontend.

## Comandos

Instalar dependencias:

```powershell
cd backend
npm install
cd ../frontend
npm install
```

Backend:

```powershell
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

```powershell
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

Docker:

```powershell
docker compose up --build
docker compose up -d postgres
docker compose down
```

## Como Criar um Novo Modulo Backend

Use a estrutura modular somente quando houver responsabilidade real:

```text
backend/src/modules/novo-dominio/
  novoDominio.routes.js
  novoDominio.validation.js
  novoDominio.controller.js
  novoDominio.service.js
  novoDominio.repository.js
```

Passos recomendados:

1. Criar validations para body, params e query.
2. Criar repository apenas com consultas Sequelize.
3. Criar service com regras de negocio.
4. Criar controller apenas com request, response e chamada do service.
5. Criar routes com middlewares, validacoes e controller.
6. Montar o modulo em `backend/src/routes/index.js`.
7. Adicionar testes especificos em `backend/test/`.
8. Preservar fachadas antigas em `backend/src/services/` quando houver consumidores.

## Como Criar uma Nova Feature Frontend

Padrao atual:

```text
frontend/src/features/nome-da-feature/
  pages/
  components/
  hooks/
  services/
  utils/
```

Use `pages/` para telas roteadas, `components/` para blocos visuais, `hooks/` para logica complexa de estado/efeitos, `services/` para chamadas especificas e `utils/` para funcoes locais da feature.

Reutilize:

- `frontend/src/api/api.js` para chamadas HTTP.
- `frontend/src/shared/constants/` para status e rotulos.
- `frontend/src/shared/formatters/` para formatacoes.
- `frontend/src/components/admin/` e `features/admin-shared/` no admin.

## Fachadas de Compatibilidade

Fachadas antigas ainda existentes:

- `backend/src/services/reservaService.js`
- `backend/src/services/expiracaoReservaService.js`
- `backend/src/services/mercadoPagoService.js`
- `backend/src/services/logService.js`
- `backend/src/services/clienteService.js`
- `backend/src/services/verificacaoEmailService.js`

Elas reexportam ou delegam para os modulos novos e existem para preservar imports de consumidores antigos.

## Limitacoes e Melhorias Futuras

Riscos e melhorias ainda conhecidos:

- Tokens administrativos no `localStorage`.
- Consulta publica de status de reserva por ID numerico.
- Matriz de permissoes administrativas ainda pouco granular.
- Transicoes monotônicas de webhook Mercado Pago podem ser reforcadas.
- Consistencia entre registros de arquivos no banco e arquivos fisicos pode ser reforcada.
- Rate limit atual e em memoria e nao e compartilhado entre multiplas instancias.
- Banner de cookies e politicas LGPD ainda precisam de definicao.

Outras melhorias possiveis:

- Separar armazenamento de rate limit para Redis ou outro store distribuido se houver multiplas instancias.
- Adicionar validacao de assinatura real de conteudo dos uploads alem de MIME/extensao.
- Criar matriz formal de permissoes por perfil administrativo.
- Documentar contratos de resposta em OpenAPI quando a API estabilizar.
