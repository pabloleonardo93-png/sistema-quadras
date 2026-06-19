# Sistema de Quadras

Repositório do sistema de locação de quadras de areia.

## Estrutura atual

```text
sistema-quadras/
├── frontend/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── eslint.config.js
│   └── vite.config.js
├── .gitattributes
├── .gitignore
└── README.md
```

- `frontend/`: aplicação React/Vite com o site público atual e a prévia do painel administrativo.
- Backend ainda não foi organizado nesta etapa.
- Arquivos de Git e documentação geral ficam na raiz do repositório.
- Arquivos específicos do frontend ficam dentro de `frontend/`.

## Rodar o frontend

Requisitos:

- Node.js 20.19+ ou 22.12+
- npm

A partir da raiz do repositório:

```bash
cd frontend
npm install
npm run dev
```

Depois acesse:

- Site público: `http://localhost:5173/`
- Painel admin: `http://localhost:5173/admin`
- Login admin: `http://localhost:5173/admin/login`
- Dashboard admin: `http://localhost:5173/admin/dashboard`

## Scripts do frontend

Execute sempre dentro da pasta `frontend`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Estrutura do frontend

```text
frontend/src/
├── assets/
├── components/
├── constants/
├── contexts/
├── hooks/
├── pages/
├── routes/
├── services/
├── utils/
├── App.jsx
├── main.jsx
└── index.css
```

