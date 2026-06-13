import {
  CircleDot,
  Footprints,
  Trophy,
} from "lucide-react";

export const modalities = [
  {
    id: "beach-tennis",
    name: "Beach Tennis",
    eyebrow: "Rápido e vibrante",
    description:
      "Raquetes, areia e partidas que não deixam o ritmo cair. Ideal para duplas de todos os níveis.",
    icon: CircleDot,
    accent: "coral",
  },
  {
    id: "futevolei",
    name: "Futevôlei",
    eyebrow: "Técnica no alto",
    description:
      "Domínio, equilíbrio e resenha boa. A quadra certa para treinos ou jogos entre amigos.",
    icon: Footprints,
    accent: "blue",
  },
  {
    id: "volei-de-areia",
    name: "Vôlei de Areia",
    eyebrow: "Jogo em equipe",
    description:
      "Monte seu time e ocupe a areia com estrutura completa, rede regulada e iluminação profissional.",
    icon: Trophy,
    accent: "yellow",
  },
];

export const courts = [
  {
    id: "onda-1",
    name: "Onda 01",
    subtitle: "Quadra central",
    modalities: ["Beach Tennis", "Vôlei de Areia"],
    status: "available",
    statusLabel: "Disponível hoje",
    image:
      "https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=1200&q=85",
    detail: "Areia branca • Iluminação LED",
  },
  {
    id: "onda-2",
    name: "Onda 02",
    subtitle: "Quadra panorâmica",
    modalities: ["Futevôlei", "Beach Tennis"],
    status: "busy",
    statusLabel: "Próximo às 18h",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=85",
    detail: "Areia premium • Arquibancada",
  },
  {
    id: "onda-3",
    name: "Onda 03",
    subtitle: "Quadra de treino",
    modalities: ["Beach Tennis", "Futevôlei", "Vôlei de Areia"],
    status: "maintenance",
    statusLabel: "Manutenção",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85",
    detail: "Multiuso • Chuveiro próximo",
  },
];

export const availableTimes = [
  { time: "08:00", available: true },
  { time: "09:00", available: true },
  { time: "10:00", available: false },
  { time: "11:00", available: true },
  { time: "14:00", available: true },
  { time: "15:00", available: false },
  { time: "16:00", available: true },
  { time: "17:00", available: true },
  { time: "18:00", available: true },
  { time: "19:00", available: false },
  { time: "20:00", available: true },
];

export const arenaInfo = {
  address: "Av. das Palmeiras, 640 • Jardim Atlântico",
  city: "São Paulo, SP",
  phone: "(11) 99999-2026",
  whatsapp: "5511999992026",
  openingHours: "Seg a dom • 07h às 23h",
};
