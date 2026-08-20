# Pé na Areia — Sistema de Quadras

Sistema full stack desenvolvido para apoiar a operação do clube Pé na Areia.
A aplicação reúne a apresentação institucional, o fluxo de reservas dos
clientes, pagamentos pelo Mercado Pago e um painel administrativo para a
equipe do clube.

O projeto é formado por uma aplicação React e uma API REST em Node.js. O
ambiente completo pode ser executado com Docker Compose, incluindo PostgreSQL,
Nginx e os serviços de apoio à publicação.

## Funcionalidades

### Área do cliente

- apresentação do clube, das quadras, dos eventos e dos canais de contato;
- consulta de horários e reserva de quadras;
- verificação de e-mail antes da criação da reserva;
- pagamento por Pix ou cartão com Mercado Pago;
- acompanhamento do status do pagamento e das reservas;
- consentimento de cookies e página de privacidade.

### Painel administrativo

- gestão de reservas, quadras, modalidades e horários;
- consulta e gestão de clientes;
- publicação de comunicados;
- relatórios operacionais e registros de ações do sistema;
- envio e controle de arquivos.

### Regras e segurança

- autenticação administrativa com JWT e senhas protegidas com bcrypt;
- validação de origem, CORS e cabeçalhos de segurança com Helmet;
- limites persistentes por e-mail e IP nos fluxos sensíveis;
- proteção contra reservas duplicadas na aplicação e no PostgreSQL;
- validação de assinatura, valor, moeda e referência nos webhooks de pagamento;
- sessão temporária de e-mail verificado em cookie HttpOnly.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, Vite, React Router e GSAP |
| Backend | Node.js 20, Express 5 e Sequelize |
| Banco de dados | PostgreSQL 17 |
| Integrações | Mercado Pago e Resend |
| Infraestrutura | Docker Compose, Nginx, GitHub Actions e WUD |
| Qualidade | ESLint e testes nativos do Node.js |

## Arquitetura

O navegador acessa o frontend servido pelo Nginx. As requisições para `/api`
são encaminhadas à API Express, que concentra as regras de negócio e persiste
os dados no PostgreSQL. Mercado Pago e Resend são acessados somente pelo
backend; suas credenciais não ficam disponíveis no código do frontend.

Os principais fluxos estão separados em controllers, services, models,
middlewares e routes. As alterações do banco são controladas por migrations e
os dados iniciais do ambiente por seeders.

```text
.
├── backend/
│   ├── src/
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── nginx/
├── .github/workflows/
├── docker-compose.yml
└── Dockerfile
```

## Como executar com Docker

### Requisitos

- Docker com suporte ao Docker Compose;
- portas `8080` e `3000` disponíveis no computador.

Crie o arquivo local de configuração a partir do exemplo:

```bash
cp .env.example .env
```

No Windows, também é possível copiar o arquivo pelo Explorador ou executar:

```powershell
Copy-Item .env.example .env
```

Antes de iniciar, substitua no `.env` as senhas e chaves marcadas para troca.
Depois, execute:

```bash
docker compose up --build
```

No ambiente local, os endereços padrão são:

- sistema: `http://localhost:8080`;
- API: `http://localhost:8080/api`;
- painel administrativo: `http://localhost:8080/admin/login`.

As migrations e os seeders são executados na inicialização do backend. Para
encerrar os containers sem apagar os dados locais:

```bash
docker compose down
```

## Como executar em desenvolvimento

Suba somente o PostgreSQL:

```bash
docker compose up -d postgres
```

Instale e inicie o backend:

```bash
cd backend
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Em outro terminal, instale e inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

Nesse modo, o frontend abre em `http://localhost:5173` e a API responde em
`http://localhost:3000/api`. Se necessário, ajuste as URLs no `.env` para esse
cenário.

## Variáveis de ambiente

O arquivo [`.env.example`](.env.example) contém as configurações usadas pelo
Docker Compose e as principais opções do backend. Copie o arquivo para `.env`
e mantenha credenciais reais somente no ambiente local ou nos secrets da
plataforma de publicação.

As integrações externas são opcionais no desenvolvimento:

- use `EMAIL_VERIFICATION_PROVIDER=mock` para testar sem enviar e-mails;
- mantenha as variáveis do Mercado Pago vazias enquanto o pagamento não for
  utilizado;
- em produção, configure um `MERCADO_PAGO_WEBHOOK_SECRET` próprio e uma
  `JWT_SECRET` longa e aleatória.

## Testes e qualidade

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

O workflow do GitHub Actions executa essas verificações em Pull Requests. A
publicação das imagens no GitHub Container Registry ocorre somente em pushes
para a branch `main` após a aprovação de todas as etapas de qualidade.

## Documentação detalhada

- [Documentação do backend](backend/README.md)
- [Documentação do frontend](frontend/README.md)
