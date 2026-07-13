# Backend do Sistema de Quadras

API REST do Pé na Areia em JavaScript com Node.js, Express, Sequelize, PostgreSQL e Docker. O código segue uma organização simples no estilo Agenda: controllers recebem requisições, models representam tabelas, routes definem URLs, middlewares cuidam da segurança e services concentram apenas regras importantes.

## Tecnologias

- Node.js e Express;
- Sequelize e PostgreSQL;
- Docker Compose;
- JWT e bcrypt;
- CORS e Helmet;
- Multer para upload local;
- Sequelize CLI para migrations e seeders;
- ESLint e testes nativos do Node.js.

## Estrutura

~~~text
backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── test/
├── uploads/
├── eslint.config.js
└── package.json
~~~

A pasta **uploads/** é criada automaticamente e não é versionada.

## Requisitos

- Node.js 20 ou mais recente;
- Docker Desktop em execução;
- portas 3000 e 5432 disponíveis.

## Instalação

~~~powershell
cd backend
npm install
~~~

Use o arquivo **.env** da raiz do projeto. O backend carrega esse arquivo mesmo quando você roda comandos dentro da pasta `backend`.

Configure nele as variáveis **NODE_ENV**, **PORT**, **CORS_ORIGIN**, **DB_HOST**, **DB_PORT**, **DB_NAME**, **DB_USER**, **DB_PASSWORD**, **POSTGRES_DB**, **POSTGRES_USER**, **POSTGRES_PASSWORD**, **POSTGRES_PORT**, **JWT_SECRET**, **JWT_EXPIRES_IN**, **ADMIN_SEED_NAME**, **ADMIN_SEED_EMAIL**, **ADMIN_SEED_PASSWORD**, **UPLOAD_DIR**, **UPLOAD_MAX_SIZE**, **APP_PUBLIC_URL**, **API_PUBLIC_URL**, **MERCADO_PAGO_ACCESS_TOKEN**, **MERCADO_PAGO_WEBHOOK_URL**, **MERCADO_PAGO_WEBHOOK_SECRET**, **RESEND_API_KEY**, **RESEND_TEMPLATE_VERIFICACAO_ID** e **EMAIL_FROM**.

Defina com atenção:

- **DB_PASSWORD** e **POSTGRES_PASSWORD** para a mesma senha local;
- **JWT_SECRET** para uma chave longa e aleatória;
- **ADMIN_SEED_PASSWORD** para a senha do administrador local.

O arquivo **.env** da raiz é ignorado pelo Git. Nunca envie credenciais reais ao repositório.

Para validar e-mail em producao com Resend, configure:

~~~env
RESEND_API_KEY=sua_chave_do_resend
RESEND_TEMPLATE_VERIFICACAO_ID=id_do_template_publicado
EMAIL_FROM="Pe na Areia <reservas@seudominio.com>"
EMAIL_VERIFICATION_PROVIDER=resend
CODIGO_VERIFICACAO_EXPIRACAO_MINUTOS=10
~~~

O remetente de **EMAIL_FROM** precisa pertencer a um dominio/remetente verificado no painel do Resend. O backend envia a variavel **codigo** para o template publicado. Para teste local sem envio real, use **EMAIL_VERIFICATION_PROVIDER=mock**.

## Banco de dados

Suba o PostgreSQL:

~~~powershell
docker compose up -d
~~~

Crie as tabelas:

~~~powershell
npm run db:migrate
~~~

Crie o administrador e as modalidades iniciais:

~~~powershell
npm run db:seed
~~~

As modalidades criadas são Beach Tennis, Futevôlei e Vôlei de Areia.

Para recriar todas as tabelas e executar o seeder novamente:

~~~powershell
npm run db:reset
~~~

Esse comando apaga os dados das tabelas gerenciadas pelas migrations.

Para parar o banco sem apagar o volume:

~~~powershell
docker compose down
~~~

Para parar e apagar os dados locais da Parte 4:

~~~powershell
docker compose down -v
~~~

## Iniciar a API

~~~powershell
npm run dev
~~~

Para iniciar sem o modo de observação:

~~~powershell
npm start
~~~

A API responde em http://localhost:3000/api.

~~~text
GET http://localhost:3000/api/health
~~~

## Autenticação

O administrador é criado pelo seeder com **ADMIN_SEED_EMAIL** e **ADMIN_SEED_PASSWORD** definidos no **.env** da raiz.

~~~http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@teste.com",
  "senha": "senha_definida_no_env"
}
~~~

A resposta contém o token JWT. Nas rotas protegidas envie:

~~~text
Authorization: Bearer SEU_TOKEN
~~~

A senha nunca é retornada pela API.

## Rotas principais

### Clientes

- **POST /api/clientes**: público;
- **GET /api/clientes**: administrador;
- **GET /api/clientes/:id**: administrador;
- **PUT /api/clientes/:id**: administrador;
- **PATCH /api/clientes/:id/status**: administrador.

~~~json
{
  "nome": "Cliente Teste",
  "telefone": "11999999999",
  "email": "cliente@teste.com"
}
~~~

### Verificacao de e-mail da reserva

- **POST /api/verificacao-email/enviar**: envia um codigo de 6 digitos para o e-mail informado;
- **POST /api/verificacao-email/confirmar**: valida o codigo e retorna um JWT temporario da verificacao.

~~~json
{
  "email": "cliente@teste.com"
}
~~~

~~~json
{
  "email": "cliente@teste.com",
  "codigo": "123456"
}
~~~

O codigo vale por 10 minutos, tem limite de tentativas e fica salvo apenas como hash. O JWT temporario deve ser enviado nas rotas que criam reserva pelo header:

~~~text
X-Email-Verification-Token: TOKEN_DA_VERIFICACAO
~~~

O backend usa o e-mail de dentro desse token para criar ou atualizar o cliente da reserva. A chave **RESEND_API_KEY** fica somente no backend.

### Quadras

- **GET /api/quadras**: público, somente ativas;
- **GET /api/quadras/:id**: público;
- **POST /api/quadras**: administrador;
- **PUT /api/quadras/:id**: administrador;
- **PATCH /api/quadras/:id/status**: administrador.

~~~json
{
  "nome": "Areia 01",
  "descricao": "Quadra principal",
  "valorHora": 80,
  "imagemUrl": null,
  "modalidadesIds": [1, 2, 3]
}
~~~

### Modalidades

- **GET /api/modalidades**: público;
- **GET /api/modalidades/:id**: público;
- **POST /api/modalidades**: administrador;
- **PUT /api/modalidades/:id**: administrador;
- **PATCH /api/modalidades/:id/status**: administrador.

### Horários

- **GET /api/horarios/disponiveis**: público;
- **GET /api/horarios**: administrador;
- **POST /api/horarios**: administrador;
- **PATCH /api/horarios/:id/bloquear**: administrador;
- **PATCH /api/horarios/:id/liberar**: administrador.

~~~json
{
  "quadraId": 1,
  "data": "2026-07-01",
  "horaInicio": "18:00",
  "horaFim": "19:00"
}
~~~

### Reservas

- **POST /api/reservas**: público, exige JWT temporario de e-mail validado;
- **POST /api/reservas/:id/pagamento**: público, cria checkout do Mercado Pago com o valor da reserva;
- **GET /api/reservas/:id/status**: público, retorna status resumido da reserva e do pagamento;
- **GET /api/reservas**: administrador;
- **GET /api/reservas/:id**: administrador;
- **PATCH /api/reservas/:id/confirmar**: administrador;
- **PATCH /api/reservas/:id/cancelar**: administrador;
- **PATCH /api/reservas/:id/finalizar**: administrador.

~~~json
{
  "clienteId": 1,
  "quadraId": 1,
  "modalidadeId": 1,
  "horarioId": 1,
  "observacoes": "Reserva pelo site"
}
~~~

A API bloqueia uma segunda reserva para a mesma quadra, data e hora com HTTP 409. A proteção existe no **reservaService.js** e também em um índice único parcial do PostgreSQL. Ao cancelar uma reserva, o horário volta a ficar disponível.

### Pagamentos

- **POST /api/reservas/:id/pagamento**: cria uma preferência do Mercado Pago para a reserva informada;
- **POST /api/pagamentos/mercadopago/criar**: cria reserva e checkout em um fluxo unico, exige JWT temporario de e-mail validado;
- **POST /api/pagamentos/mercadopago/pix/criar**: cria reserva e pagamento Pix direto pela API do Mercado Pago, retornando QR Code, Pix Copia e Cola e prazo de pagamento;
- **POST /api/webhooks/mercadopago**: recebe notificações do Mercado Pago e atualiza a reserva;
- **POST /api/pagamentos/mercadopago/webhook** e **POST /api/pagamentos/mercado-pago/webhook**: aliases mantidos por compatibilidade.

O token do Mercado Pago fica somente no **.env** da raiz, lido pelo backend:

~~~env
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_do_mercado_pago
APP_PUBLIC_URL=http://localhost:5173
API_PUBLIC_URL=http://localhost:3000
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/mercadopago
MERCADO_PAGO_WEBHOOK_SECRET=segredo_do_webhook_se_configurado
~~~

Status de reservas:

- `aguardando_pagamento`;
- `confirmada`;
- `cancelada`;
- `expirada`.

Status de pagamentos:

- `pendente`;
- `aprovado`;
- `recusado`;
- `cancelado`;
- `estornado`.

Cada reserva possui `valorTotal`, `pagamentoStatus`, `mercadoPagoPreferenceId`, `mercadoPagoPaymentId`, `pagamentoUrl`, `pagamentoCriadoEm` e `pagoEm`. Para Pix direto, o backend define `date_of_expiration` com o mesmo prazo configurado em `RESERVA_PAGAMENTO_TEMPO_MINUTOS`. Quando o Mercado Pago retorna pagamento aprovado, a reserva passa para **confirmada** e o pagamento para **aprovado**. Se o pagamento for cancelado, recusado, estornado ou expirar, a reserva é cancelada ou expirada e o horário volta a ficar disponível.

### Comunicados

- **GET /api/comunicados/publicos**: público;
- **POST /api/comunicados**: administrador;
- **GET /api/comunicados**: administrador;
- **GET /api/comunicados/:id**: administrador;
- **PUT /api/comunicados/:id**: administrador;
- **PATCH /api/comunicados/:id/publicar**: administrador;
- **PATCH /api/comunicados/:id/arquivar**: administrador.

### Arquivos

- **POST /api/arquivos/upload**: administrador;
- **GET /api/arquivos**: administrador;
- **DELETE /api/arquivos/:id**: administrador.

O formulário deve usar **multipart/form-data** e o campo deve se chamar **arquivo**.

~~~powershell
curl.exe -X POST http://localhost:3000/api/arquivos/upload -H "Authorization: Bearer SEU_TOKEN" -F "arquivo=@C:/caminho/imagem.jpg" -F "entidade=quadra" -F "entidadeId=1"
~~~

São aceitos JPEG, PNG, WEBP e PDF, com limite padrão de 5 MB. O servidor gera um nome aleatório e impede caminhos fornecidos pelo usuário.

### Relatórios

Todas exigem autenticação:

- **GET /api/relatorios/dashboard**;
- **GET /api/relatorios/reservas**;
- **GET /api/relatorios/ocupacao**;
- **GET /api/relatorios/modalidades**.

O dashboard retorna reservas do dia e da semana, clientes, quadras ativas, reservas confirmadas/canceladas e horários mais procurados.

### Logs

- **GET /api/logs**: administrador;
- **GET /api/logs/:id**: administrador.

Os logs registram login, clientes, quadras, modalidades, horários, reservas, comunicados e arquivos.

## Testes e qualidade

~~~powershell
npm test
npm run lint
~~~

## Segurança

- senhas protegidas com bcrypt;
- autenticação JWT;
- rotas administrativas protegidas;
- CORS limitado às origens configuradas;
- cabeçalhos de segurança com Helmet;
- mensagens internas não são expostas;
- upload limitado por tipo e tamanho;
- nomes de arquivo aleatórios;
- reserva duplicada protegida na API e no banco;
- **.env**, uploads, logs e dependências fora do Git.

## Dockerfile do backend

O backend tambem possui um `Dockerfile` proprio. Ele instala as dependencias Node, copia a API e inicia com:

~~~powershell
npm start
~~~

Para subir apenas o banco local, use o `docker-compose.yml` da raiz do projeto:

~~~powershell
cd ..
docker compose up -d postgres
~~~

Para subir o sistema inteiro em containers, use o `docker-compose.yml` da raiz do projeto. Nesse fluxo, o backend fica interno na rede Docker e o Nginx da pasta `nginx/` expõe o frontend e encaminha `/api` para a API:

~~~powershell
cd ..
New-Item .env -ItemType File
docker compose up --build
~~~

Nesse fluxo completo, o servico `backend` aguarda o PostgreSQL, executa migrations e seeders, e entao inicia a API internamente na porta 3000. Do navegador, acesse a API por `http://localhost:8080/api`.
