# Sistema de Quadras

Sistema de locacao de quadras de areia do Pe na Areia.

## Estrutura

```txt
sistema-quadras/
  frontend/           # React + Vite
  backend/            # Express + Sequelize + PostgreSQL
  nginx/              # gateway unico: frontend estatico + proxy /api
  docker-compose.yml  # stack completa: nginx, backend e banco
  .gitignore
  README.md
```

## Rodar Tudo Com Docker

Crie um arquivo local `.env` na raiz do projeto com as variaveis exigidas pelo `docker-compose.yml`. Esse arquivo nao deve ser versionado.

```powershell
New-Item .env -ItemType File
```

Suba Nginx, backend e PostgreSQL:

```powershell
docker compose up --build
```

Acessos:

- Frontend via Nginx: http://localhost:8080
- API via gateway: http://localhost:8080/api
- Health check via gateway: http://localhost:8080/api/health
- Painel admin: http://localhost:8080/admin/login

O container do backend executa migrations e seeders antes de iniciar a API. O backend fica interno na rede Docker e o Nginx expoe o frontend e o proxy `/api`. O administrador inicial usa `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` configurados no `.env`.

### Reservas e pagamentos com Mercado Pago

O pagamento nao usa link aberto com valor digitado pelo cliente. O fluxo correto e:

1. o cliente escolhe quadra, data e horario;
2. a API calcula o valor da reserva;
3. o backend cria uma preferencia no Mercado Pago;
4. o cliente e redirecionado para o checkout;
5. o webhook atualiza a reserva como `confirmada`, `cancelada` ou `expirada` e o pagamento como `pendente`, `aprovado`, `recusado`, `cancelado` ou `estornado`.

Configure as variaveis no `.env` da raiz. Nao envie esse arquivo para o GitHub.

```env
APP_PUBLIC_URL=http://localhost:8080
API_PUBLIC_URL=http://localhost:8080
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_do_mercado_pago
MERCADO_PAGO_WEBHOOK_URL=http://localhost:8080/api/webhooks/mercadopago
MERCADO_PAGO_WEBHOOK_SECRET=
```

Endpoints principais do fluxo:

- `POST /api/pagamentos/mercadopago/criar`
- `POST /api/webhooks/mercadopago`
- `GET /api/reservas/:id/status`

Para producao, `APP_PUBLIC_URL`, `API_PUBLIC_URL` e `MERCADO_PAGO_WEBHOOK_URL` devem usar o dominio publico real. Em ambiente local, o webhook do Mercado Pago so consegue chamar sua API se voce usar uma URL publica temporaria, como um tunel de desenvolvimento.

Para parar:

```powershell
docker compose down
```

## Rodar Sem Docker

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Site publico: http://localhost:5173/
- Painel administrativo: http://localhost:5173/admin/login

No Vite, as chamadas para `/api` sao encaminhadas para `http://localhost:3000`.

### Backend

```powershell
cd backend
npm install
New-Item .env -ItemType File
# Configure o .env local antes de continuar
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

- API: http://localhost:3000/api
- Health check: http://localhost:3000/api/health

A API possui JWT, clientes, quadras, modalidades, horarios, reservas, pagamentos Mercado Pago, comunicados, upload seguro, relatorios e logs. Consulte a documentacao completa em `backend/README.md`.
