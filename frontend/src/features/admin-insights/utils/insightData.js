export function toLocalDate(value) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameLocalDate(first, second) {
  return Boolean(first && second)
    && first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

export function getInitials(name = "") {
  return String(name || "Cliente")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "CL";
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export function formatShortDate(value) {
  const date = toLocalDate(value);
  if (!date) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(/\.$/, "");
}

export function formatWeekdayDate(value) {
  const date = toLocalDate(value);
  if (!date) return "--";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .format(date)
    .replace(/\.$/, "");
}

export function paymentLocalDate(reservation) {
  if (reservation?.pagoEm) {
    const date = new Date(reservation.pagoEm);
    if (!Number.isNaN(date.getTime())) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
  }
  return toLocalDate(reservation?.data);
}

export function reservationStatusLabel(status) {
  return {
    aguardando_pagamento: "Aguardando pagamento",
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    expirada: "Expirada",
    finalizada: "Finalizada",
  }[status] || status || "--";
}

export function reservationStatusTone(status) {
  return {
    confirmada: "success",
    aguardando_pagamento: "warning",
    finalizada: "info",
    cancelada: "danger",
    expirada: "neutral",
  }[status] || "neutral";
}

export function getPeriodBounds(period = "all", baseDate = new Date()) {
  const end = new Date(baseDate);
  end.setHours(0, 0, 0, 0);

  if (period === "today") {
    return { start: end, end, previousStart: new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1), previousEnd: new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1) };
  }

  if (period === "week") {
    const start = new Date(end);
    start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
    const previousEnd = new Date(start);
    previousEnd.setDate(start.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - 6);
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6), previousStart, previousEnd };
  }

  if (period === "month") {
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);
    const previousStart = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const previousEnd = new Date(end.getFullYear(), end.getMonth(), 0);
    return { start, end: monthEnd, previousStart, previousEnd };
  }

  return null;
}

export function isWithinBounds(value, bounds) {
  if (!bounds) return true;
  const date = toLocalDate(value);
  return Boolean(date && date >= bounds.start && date <= bounds.end);
}

export function percentageChange(current, previous) {
  if (!Number.isFinite(previous) || previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
