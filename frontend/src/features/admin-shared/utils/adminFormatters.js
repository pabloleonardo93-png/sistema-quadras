import { PAGAMENTO_STATUS } from "../../../shared/constants/pagamentoStatus";
import { RESERVA_STATUS } from "../../../shared/constants/reservaStatus";
import { HORARIO_STATUS } from "../../../shared/constants/adminStatus";

export function formatarDataAdmin(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-");
  if (!ano || !mes || !dia) return data || "--";
  return `${dia}/${mes}/${ano}`;
}

export function obterDataAdmin(data) {
  const [ano, mes, dia] = String(data || "").slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const dataLocal = new Date(ano, mes - 1, dia);
  return Number.isNaN(dataLocal.getTime()) ? null : dataLocal;
}

export function formatarDataISOAdmin(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function encontrarDataPadraoAgenda(datas = []) {
  const hoje = formatarDataISOAdmin();
  return datas.find((data) => data >= hoje) || datas[0] || "";
}

export function formatarDataReservaAdmin(data) {
  const dataLocal = obterDataAdmin(data);
  if (!dataLocal) {
    const valor = data || "--";
    return {
      day: "--",
      full: valor,
      month: valor,
      weekday: "Data",
      year: "",
    };
  }

  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(dataLocal)
    .replace(/\.$/, "");
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(dataLocal)
    .replace(/\.$/, "");

  return {
    day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(dataLocal),
    full: new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(dataLocal),
    month,
    weekday,
    year: new Intl.DateTimeFormat("pt-BR", { year: "numeric" }).format(dataLocal),
  };
}

export function formatarHoraAdmin(hora) {
  return String(hora || "").slice(0, 5) || "--";
}

export function formatarMoedaAdmin(valor) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(Number(valor || 0));
}

export function obterDataHoraReserva(reserva) {
  const dataLocal = obterDataAdmin(reserva?.data);
  if (!dataLocal) return null;

  const [hora = 0, minuto = 0] = String(reserva?.horaInicio || "00:00")
    .slice(0, 5)
    .split(":")
    .map(Number);

  dataLocal.setHours(
    Number.isFinite(hora) ? hora : 0,
    Number.isFinite(minuto) ? minuto : 0,
    0,
    0,
  );
  return dataLocal;
}

export function estaNaSemanaAtual(data) {
  const dataLocal = obterDataAdmin(data);
  if (!dataLocal) return false;

  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  return dataLocal >= inicio && dataLocal <= fim;
}

export function estaNoMesAtual(data) {
  const dataLocal = obterDataAdmin(data);
  if (!dataLocal) return false;
  const hoje = new Date();
  return dataLocal.getFullYear() === hoje.getFullYear() && dataLocal.getMonth() === hoje.getMonth();
}

export function calcularOcupacaoHorarios(horarios = []) {
  const horariosValidos = horarios.filter((horario) => horario.status !== HORARIO_STATUS.BLOQUEADO);
  const reservados = horariosValidos.filter((horario) => horario.status === HORARIO_STATUS.RESERVADO).length;
  const total = horariosValidos.length;
  return {
    percent: total ? Math.round((reservados / total) * 100) : null,
    reserved: reservados,
    total,
  };
}

export function montarOcupacaoPorHorario(horarios = []) {
  const grupos = horarios
    .filter((horario) => horario.status !== HORARIO_STATUS.BLOQUEADO)
    .reduce((acc, horario) => {
      const hora = formatarHoraAdmin(horario.horaInicio);
      if (!acc[hora]) acc[hora] = { hour: hora.replace(":00", "h"), reserved: 0, total: 0 };
      acc[hora].total += 1;
      if (horario.status === HORARIO_STATUS.RESERVADO) acc[hora].reserved += 1;
      return acc;
    }, {});

  return Object.values(grupos)
    .filter((item) => item.total > 0)
    .map((item) => ({
      ...item,
      percent: Math.round((item.reserved / item.total) * 100),
    }))
    .sort((a, b) => a.hour.localeCompare(b.hour, "pt-BR", { numeric: true }));
}

export function obterIniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return "--";
  return partes.slice(0, 2).map((parte) => parte[0]).join("").toUpperCase();
}

export function obterTipoPiso(reserva) {
  return reserva?.quadra?.tipoPiso || reserva?.quadra?.piso || reserva?.horario?.tipoPiso || "";
}

export function obterPeriodoReserva(periodo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);

  if (periodo === "hoje") return { inicio: hoje, fim };
  if (periodo === "7d" || periodo === "30d") {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - (periodo === "7d" ? 6 : 29));
    return { inicio, fim };
  }
  if (periodo === "mes") {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio, fim };
  }
  return { inicio: null, fim: null };
}

export function reservaDentroPeriodo(reserva, periodo) {
  const { inicio, fim } = obterPeriodoReserva(periodo);
  if (!inicio || !fim) return true;
  const data = obterDataAdmin(reserva.data);
  return data ? data >= inicio && data <= fim : false;
}

export function calcularResumoStatus(reservas = []) {
  return reservas.reduce(
    (acc, reserva) => {
      acc.total += 1;
      acc[reserva.status] = (acc[reserva.status] || 0) + 1;
      if (reserva.pagamentoStatus === PAGAMENTO_STATUS.APROVADO) {
        acc.receitaConfirmada += Number(reserva.valorTotal || 0);
      }
      return acc;
    },
    {
      total: 0,
      [RESERVA_STATUS.AGUARDANDO_PAGAMENTO]: 0,
      [RESERVA_STATUS.CANCELADA]: 0,
      [RESERVA_STATUS.CONFIRMADA]: 0,
      [RESERVA_STATUS.EXPIRADA]: 0,
      [RESERVA_STATUS.FINALIZADA]: 0,
      receitaConfirmada: 0,
    },
  );
}

export function porcentagem(parte, total) {
  if (!total) return "--";
  return `${Math.round((Number(parte || 0) / Number(total)) * 100)}%`;
}

export function percentualNumero(parte, total, casas = 1) {
  if (!total) return null;
  return Number(((Number(parte || 0) / Number(total)) * 100).toFixed(casas));
}

export function formatarPercentualAdmin(valor, casas = 1) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "--";
  return `${Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: casas,
    minimumFractionDigits: casas,
  })}%`;
}

export function obterPeriodoRelatorio(periodo) {
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  const inicio = new Date(fim);
  inicio.setHours(0, 0, 0, 0);

  if (periodo === "7d") inicio.setDate(inicio.getDate() - 6);
  if (periodo === "30d") inicio.setDate(inicio.getDate() - 29);
  if (periodo === "mes") inicio.setDate(1);
  if (periodo === "todos") return {};

  return {
    fim: formatarDataISOAdmin(fim),
    inicio: formatarDataISOAdmin(inicio),
  };
}

export function normalizarBusca(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
