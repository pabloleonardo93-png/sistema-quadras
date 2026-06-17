export const adminStats = [
  {
    id: "reservas-dia",
    label: "Reservas hoje",
    value: "18",
    trend: "+12%",
    tone: "green",
  },
  {
    id: "reservas-semana",
    label: "Reservas na semana",
    value: "96",
    trend: "+8%",
    tone: "blue",
  },
  {
    id: "clientes",
    label: "Clientes cadastrados",
    value: "342",
    trend: "+24",
    tone: "sand",
  },
  {
    id: "quadras",
    label: "Quadras ativas",
    value: "3/4",
    trend: "1 manutenção",
    tone: "orange",
  },
  {
    id: "horario-top",
    label: "Horário mais procurado",
    value: "19:00",
    trend: "noite cheia",
    tone: "dark",
  },
  {
    id: "ocupacao",
    label: "Ocupação simulada",
    value: "78%",
    trend: "+5%",
    tone: "green",
  },
];

export const adminReservations = [
  {
    id: "R-1048",
    customer: "Marina Costa",
    phone: "(11) 98888-4102",
    court: "Onda 01",
    modality: "Beach Tennis",
    date: "Hoje",
    time: "08:00",
    status: "Confirmada",
    payment: "Pix recebido",
  },
  {
    id: "R-1049",
    customer: "Diego Alves",
    phone: "(11) 97777-1940",
    court: "Onda 02",
    modality: "Futevôlei",
    date: "Hoje",
    time: "18:00",
    status: "Pendente",
    payment: "Aguardando sinal",
  },
  {
    id: "R-1050",
    customer: "Camila Rocha",
    phone: "(11) 96666-8020",
    court: "Onda 01",
    modality: "Vôlei de Areia",
    date: "Amanhã",
    time: "20:00",
    status: "Confirmada",
    payment: "Na recepção",
  },
  {
    id: "R-1051",
    customer: "Bruno Matos",
    phone: "(11) 95555-7301",
    court: "Onda 03",
    modality: "Beach Tennis",
    date: "Sexta",
    time: "15:00",
    status: "Cancelada",
    payment: "Estornado",
  },
  {
    id: "R-1052",
    customer: "Equipe Solaris",
    phone: "(11) 94444-3388",
    court: "Onda 02",
    modality: "Futevôlei",
    date: "Sábado",
    time: "17:00",
    status: "Finalizada",
    payment: "Pago",
  },
];

export const adminCourts = [
  {
    id: "C-01",
    name: "Onda 01",
    image:
      "https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=900&q=85",
    modalities: ["Beach Tennis", "Vôlei de Areia"],
    status: "Ativa",
    price: "R$ 90,00",
    nextMaintenance: "26 jun",
  },
  {
    id: "C-02",
    name: "Onda 02",
    image:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=85",
    modalities: ["Futevôlei", "Beach Tennis"],
    status: "Ocupada",
    price: "R$ 110,00",
    nextMaintenance: "30 jun",
  },
  {
    id: "C-03",
    name: "Onda 03",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85",
    modalities: ["Beach Tennis", "Futevôlei", "Vôlei de Areia"],
    status: "Manutenção",
    price: "R$ 75,00",
    nextMaintenance: "em andamento",
  },
  {
    id: "C-04",
    name: "Onda Kids",
    image:
      "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=85",
    modalities: ["Vôlei de Areia"],
    status: "Inativa",
    price: "R$ 65,00",
    nextMaintenance: "sem agenda",
  },
];

export const adminSchedule = [
  {
    court: "Onda 01",
    slots: [
      { time: "08:00", status: "Reservado" },
      { time: "09:00", status: "Livre" },
      { time: "10:00", status: "Bloqueado" },
      { time: "11:00", status: "Livre" },
      { time: "14:00", status: "Livre" },
      { time: "15:00", status: "Reservado" },
      { time: "16:00", status: "Livre" },
      { time: "17:00", status: "Livre" },
      { time: "18:00", status: "Reservado" },
      { time: "19:00", status: "Reservado" },
      { time: "20:00", status: "Livre" },
    ],
  },
  {
    court: "Onda 02",
    slots: [
      { time: "08:00", status: "Livre" },
      { time: "09:00", status: "Livre" },
      { time: "10:00", status: "Reservado" },
      { time: "11:00", status: "Livre" },
      { time: "14:00", status: "Bloqueado" },
      { time: "15:00", status: "Livre" },
      { time: "16:00", status: "Livre" },
      { time: "17:00", status: "Reservado" },
      { time: "18:00", status: "Reservado" },
      { time: "19:00", status: "Reservado" },
      { time: "20:00", status: "Reservado" },
    ],
  },
  {
    court: "Onda 03",
    slots: [
      { time: "08:00", status: "Bloqueado" },
      { time: "09:00", status: "Bloqueado" },
      { time: "10:00", status: "Bloqueado" },
      { time: "11:00", status: "Bloqueado" },
      { time: "14:00", status: "Livre" },
      { time: "15:00", status: "Livre" },
      { time: "16:00", status: "Livre" },
      { time: "17:00", status: "Livre" },
      { time: "18:00", status: "Livre" },
      { time: "19:00", status: "Reservado" },
      { time: "20:00", status: "Livre" },
    ],
  },
];

export const adminClients = [
  {
    id: "CL-01",
    name: "Marina Costa",
    phone: "(11) 98888-4102",
    email: "marina@email.com",
    reservations: 14,
    lastReservation: "Hoje, 08:00",
    status: "Ativo",
  },
  {
    id: "CL-02",
    name: "Diego Alves",
    phone: "(11) 97777-1940",
    email: "diego@email.com",
    reservations: 8,
    lastReservation: "Hoje, 18:00",
    status: "Ativo",
  },
  {
    id: "CL-03",
    name: "Camila Rocha",
    phone: "(11) 96666-8020",
    email: "camila@email.com",
    reservations: 21,
    lastReservation: "Amanhã, 20:00",
    status: "VIP",
  },
  {
    id: "CL-04",
    name: "Bruno Matos",
    phone: "(11) 95555-7301",
    email: "bruno@email.com",
    reservations: 3,
    lastReservation: "12 jun",
    status: "Inativo",
  },
];

export const adminAnnouncements = [
  {
    id: "A-01",
    title: "Combo de horários para duplas",
    message: "Reserve dois horários seguidos e ganhe 15% de desconto na semana.",
    status: "Publicado",
    highlighted: true,
  },
  {
    id: "A-02",
    title: "Manutenção Onda 03",
    message: "A quadra Onda 03 fica bloqueada pela manhã para troca de rede.",
    status: "Publicado",
    highlighted: false,
  },
  {
    id: "A-03",
    title: "Torneio interno de sábado",
    message: "Inscrições abertas para beach tennis iniciante e intermediário.",
    status: "Rascunho",
    highlighted: true,
  },
];

export const adminFiles = [
  {
    id: "F-01",
    name: "quadra-onda-01.jpg",
    type: "Imagem",
    uploadedAt: "13 jun",
    preview:
      "https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=500&q=80",
  },
  {
    id: "F-02",
    name: "regras-da-arena.pdf",
    type: "Documento",
    uploadedAt: "11 jun",
    preview: "",
  },
  {
    id: "F-03",
    name: "evento-futevolei.mp4",
    type: "Vídeo",
    uploadedAt: "09 jun",
    preview: "",
  },
  {
    id: "F-04",
    name: "quadra-por-do-sol.jpg",
    type: "Imagem",
    uploadedAt: "07 jun",
    preview:
      "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=500&q=80",
  },
];

export const adminReports = {
  reservationsByDay: [
    { label: "Seg", value: 14 },
    { label: "Ter", value: 18 },
    { label: "Qua", value: 22 },
    { label: "Qui", value: 19 },
    { label: "Sex", value: 26 },
    { label: "Sáb", value: 31 },
    { label: "Dom", value: 28 },
  ],
  modalities: [
    { label: "Beach Tennis", value: 48 },
    { label: "Futevôlei", value: 32 },
    { label: "Vôlei de Areia", value: 20 },
  ],
  highlights: [
    { label: "Confirmadas", value: 126 },
    { label: "Canceladas", value: 9 },
    { label: "Novos clientes", value: 38 },
    { label: "Ocupação média", value: "78%" },
  ],
};
