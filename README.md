# Sistema de Quadras

Sistema de locação de quadras de areia da Arena Onda.

## Estrutura

~~~text
sistema-quadras/
├── frontend/   # React + Vite
├── backend/    # Express + Sequelize + PostgreSQL
├── .gitattributes
├── .gitignore
└── README.md
~~~

## Frontend

~~~powershell
cd frontend
npm install
npm run dev
~~~

- Site público: http://localhost:5173/
- Painel visual: http://localhost:5173/admin

## Backend

~~~powershell
cd backend
npm install
New-Item .env -ItemType File
# Preencha o .env seguindo backend/README.md
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
~~~

- API: http://localhost:3000/api
- Health check: http://localhost:3000/api/health

A API possui JWT, clientes, quadras, modalidades, horários, reservas, comunicados, upload seguro, relatórios e logs. Consulte [a documentação completa do backend](backend/README.md).

