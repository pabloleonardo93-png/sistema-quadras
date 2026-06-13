# Arena Onda

Frontend público para uma arena de quadras de areia, criado com React e Vite.
O projeto usa dados simulados e está preparado para receber uma API REST em uma
etapa futura. Não há backend neste repositório.

## Executar localmente

Requisitos:

- Node.js 20.19+ ou 22.12+
- npm

No PowerShell do Windows:

```powershell
npm.cmd install
npm.cmd run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`.

## Build de produção

```powershell
npm.cmd run build
npm.cmd run preview
```

## Estrutura

- `src/components`: componentes visuais e seções da página.
- `src/data/mockData.js`: quadras, modalidades, horários e contato simulados.
- `src/styles/global.css`: tokens, layout, responsividade e animações.
- `src/App.jsx`: composição da página e estado compartilhado da reserva.

O formulário apenas confirma a reserva visualmente. Nenhum dado é persistido ou
enviado para um serviço externo nesta etapa.
