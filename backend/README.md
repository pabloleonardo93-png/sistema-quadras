# Backend do Sistema de Quadras

API REST da Arena Onda em JavaScript com Node.js, Express, Sequelize, PostgreSQL e Docker. O código segue uma organização simples no estilo Agenda: controllers recebem requisições, models representam tabelas, routes definem URLs, middlewares cuidam da segurança e services concentram apenas regras importantes.

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
├── .env.example
├── docker-compose.yml
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
New-Item .env -ItemType File
~~~

Abra o arquivo local **.env** e configure as variáveis **NODE_ENV**, **PORT**, **CORS_ORIGIN**, **DB_HOST**, **DB_PORT**, **DB_NAME**, **DB_USER**, **DB_PASSWORD**, **POSTGRES_DB**, **POSTGRES_USER**, **POSTGRES_PASSWORD**, **POSTGRES_PORT**, **JWT_SECRET**, **JWT_EXPIRES_IN**, **ADMIN_SEED_NAME**, **ADMIN_SEED_EMAIL**, **ADMIN_SEED_PASSWORD**, **UPLOAD_DIR** e **UPLOAD_MAX_SIZE**.

Defina com atenção:

- **DB_PASSWORD** e **POSTGRES_PASSWORD** para a mesma senha local;
- **JWT_SECRET** para uma chave longa e aleatória;
- **ADMIN_SEED_PASSWORD** para a senha do administrador local.

Os arquivos **.env** e **.env.example** são ignorados pelo Git. Nunca envie credenciais reais ao repositório.

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

O administrador é criado pelo seeder com **ADMIN_SEED_EMAIL** e **ADMIN_SEED_PASSWORD** definidos no arquivo local **.env**.

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

### Quadras

- **GET /api/quadras**: público, somente ativas;
- **GET /api/quadras/:id**: público;
- **POST /api/quadras**: administrador;
- **PUT /api/quadras/:id**: administrador;
- **PATCH /api/quadras/:id/status**: administrador.

~~~json
{
  "nome": "Quadra Onda 01",
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

- **POST /api/reservas**: público;
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

O frontend ainda não foi conectado à API. Essa integração pertence à Parte 5.