# Arena Onda Frontend

Frontend React + Vite da Arena Onda, integrado com a API REST do projeto.

## Requisitos

- Node.js 20+
- API backend rodando em `http://localhost:3000/api`
- Docker e Docker Compose na raiz do projeto para deploy local com Nginx

## Configuracao

Para desenvolvimento local, o frontend usa `/api` por padrao. Crie um arquivo `.env` apenas se precisar sobrescrever a URL da API:

```env
VITE_API_URL=/api
```

O arquivo `.env` nao deve ser versionado.

No desenvolvimento local, o Vite encaminha `/api` e `/uploads` para `http://localhost:3000`.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Fluxos principais

- Site publico: `/`
- Login admin: `/admin/login`
- Dashboard admin: `/admin/dashboard`
- Reservas: `/admin/reservas`
- Quadras: `/admin/quadras`
- Modalidades: `/admin/modalidades`
- Horarios: `/admin/horarios`
- Clientes: `/admin/clientes`
- Comunicados: `/admin/comunicados`
- Relatorios: `/admin/relatorios`

Para testar o login, use o administrador criado pelo seeder do backend.

## Reserva publica

No site publico, selecione modalidade, quadra, data, horario disponivel e informe nome, telefone e e-mail. O frontend cria o cliente e envia a reserva para `POST /api/reservas`.

## Build e lint

```bash
npm run build
npm run lint
```

## Docker

O Docker completo fica na raiz do projeto. O Nginx tambem fica na raiz, em `nginx/`, e atua como gateway unico: serve o build do React e encaminha `/api` para o backend.

```bash
cd ..
docker compose up --build
```

Acesse:

- Site: `http://localhost:8080`
- API via gateway: `http://localhost:8080/api`
- Admin: `http://localhost:8080/admin/login`

Parar:

```bash
docker compose down
```

O Nginx usa fallback para `index.html`, mantendo rotas internas como `/admin/dashboard` funcionando ao atualizar a pagina.
