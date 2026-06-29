# Sistema de Quadras

Sistema de locacao de quadras de areia da Arena Onda.

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

O container do backend executa migrations e seeders antes de iniciar a API. O backend fica interno na rede Docker e o Nginx expõe o frontend e o proxy `/api`. O administrador inicial usa `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` configurados no `.env`.

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

A API possui JWT, clientes, quadras, modalidades, horarios, reservas, comunicados, upload seguro, relatorios e logs. Consulte a documentacao completa em `backend/README.md`.
