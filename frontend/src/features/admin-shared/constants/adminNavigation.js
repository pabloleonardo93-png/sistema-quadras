import { BarChart3, CalendarCheck, Clock3, LayoutDashboard, LayoutGrid, Megaphone, UsersRound } from "lucide-react";

export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "reservas", label: "Reservas", icon: CalendarCheck },
  { id: "quadras", label: "Quadras", icon: LayoutGrid },
  { id: "modalidades", label: "Modalidades", icon: BarChart3 },
  { id: "horarios", label: "Horários", icon: Clock3 },
  { id: "clientes", label: "Clientes", icon: UsersRound },
  { id: "comunicados", label: "Comunicados", icon: Megaphone },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

export const pageTitles = {
  dashboard: {
    eyebrow: "Painel de operação",
    title: "Visão geral",
    description: "Acompanhe reservas, ocupação e pendências do dia.",
  },
  reservas: {
    eyebrow: "Gestão de reservas",
    title: "Reservas",
    description: "Acompanhe solicitações, confirmações, cancelamentos e finalizações.",
  },
  quadras: {
    eyebrow: "Estrutura",
    title: "Quadras",
    description: "Gerencie status, modalidades, valores e imagens das quadras.",
  },
  modalidades: {
    eyebrow: "Modalidades",
    title: "Modalidades",
    description: "Gerencie esportes disponíveis, descrições e status.",
  },
  horarios: {
    eyebrow: "Grade operacional",
    title: "Horários",
    description: "Visualize janelas livres, reservadas e bloqueadas.",
  },
  clientes: {
    eyebrow: "Relacionamento",
    title: "Clientes",
    description: "Consulte histórico, contatos e situação dos jogadores.",
  },
  comunicados: {
    eyebrow: "Comunicação",
    title: "Comunicados",
    description: "Prepare promoções, avisos de manutenção e regras do complexo.",
  },
  relatorios: {
    eyebrow: "Indicadores",
    title: "Relatórios",
    description: "Dados reais para leitura rápida do desempenho do complexo.",
  },
};

export function routeToPath(route) {
  if (route === "login") return "/admin/login";
  if (route === "dashboard") return "/admin/dashboard";
  return `/admin/${route}`;
}
