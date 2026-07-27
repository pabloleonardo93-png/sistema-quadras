import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ListChecks,
  WalletCards,
} from "lucide-react";
import {
  formatCurrency,
  formatShortDate,
  getInitials,
  reservationStatusLabel,
  reservationStatusTone,
} from "../utils/insightData";
import { EmptyChart, StatusBadge } from "./AdminDataViz";

export function DashboardReservationsCard({ onNavigate, reservations = [] }) {
  return (
    <section className="admin-insight-card admin-dashboard-reservations">
      <header className="admin-insight-card__header">
        <div><CalendarCheck aria-hidden="true" size={17} /><h2>Próximas reservas</h2></div>
        <button type="button" onClick={() => onNavigate?.("horarios")}>Ver agenda <ArrowRight aria-hidden="true" size={14} /></button>
      </header>
      {reservations.length ? (
        <div className="admin-dashboard-reservations__list">
          {reservations.map((reservation) => (
            <article key={reservation.id}>
              <div className="admin-dashboard-reservations__time"><strong>{String(reservation.horaInicio || "").slice(0, 5) || "--"}</strong><small>{formatShortDate(reservation.data)}</small></div>
              <span className="admin-dashboard-reservations__avatar">{getInitials(reservation.cliente?.nome)}</span>
              <div className="admin-dashboard-reservations__customer"><strong>{reservation.cliente?.nome || "Cliente"}</strong><small>{reservation.modalidade?.nome || "Modalidade não informada"}</small></div>
              <div className="admin-dashboard-reservations__court"><strong>{reservation.quadra?.nome || "--"}</strong><small>{reservation.quadra?.descricao || "Quadra"}</small></div>
              <StatusBadge label={reservationStatusLabel(reservation.status)} tone={reservationStatusTone(reservation.status)} />
            </article>
          ))}
        </div>
      ) : <EmptyChart text="Não há próximas reservas para exibir." />}
      <button className="admin-insight-card__footer-action" type="button" onClick={() => onNavigate?.("reservas")}>Ver todas as reservas <ArrowRight aria-hidden="true" size={14} /></button>
    </section>
  );
}

export function PaymentsSummaryCard({ onNavigate, payments }) {
  const approvedLabel = payments.approvedCount === 1 ? "pagamento aprovado" : "pagamentos aprovados";
  return (
    <section className="admin-insight-card admin-dashboard-payments">
      <header className="admin-insight-card__header"><div><CreditCard aria-hidden="true" size={17} /><h2>Pagamentos (Mercado Pago)</h2></div></header>
      <div className={`admin-dashboard-payments__status ${payments.pendingCount ? "is-pending" : ""}`}>
        {payments.pendingCount ? <CircleAlert aria-hidden="true" size={21} /> : <CheckCircle2 aria-hidden="true" size={21} />}
        <div><strong>{payments.pendingCount ? `${payments.pendingCount} pendência${payments.pendingCount === 1 ? "" : "s"}` : "Tudo em dia"}</strong><small>{payments.pendingCount ? "Há reservas aguardando pagamento." : "Não há pendências de pagamento."}</small></div>
      </div>
      <div className="admin-dashboard-payments__numbers">
        <div><small>Recebido no mês</small><strong>{formatCurrency(payments.monthRevenue)}</strong><em>{payments.monthChange === null ? "Sem base anterior" : `${payments.monthChange >= 0 ? "+" : ""}${payments.monthChange}% vs. mês anterior`}</em></div>
        <div><small>Aprovados</small><strong>{payments.approvedCount}</strong><em>{approvedLabel}</em></div>
      </div>
      <button className="admin-insight-card__footer-action" type="button" onClick={() => onNavigate?.("reservas")}>Ver movimentações <ArrowRight aria-hidden="true" size={14} /></button>
    </section>
  );
}

export function QuickSummaryCard({ items = [], onNavigate }) {
  const icons = { reservations: ListChecks, occupancy: Clock3, pending: WalletCards };
  return (
    <section className="admin-insight-card admin-dashboard-quick">
      <header className="admin-insight-card__header"><div><CircleDollarSign aria-hidden="true" size={17} /><h2>Resumo rápido</h2></div></header>
      <div className="admin-dashboard-quick__list">
        {items.map((item) => {
          const Icon = icons[item.id] || CalendarCheck;
          return <button key={item.id} type="button" onClick={() => onNavigate?.(item.route)}><span className={`admin-dashboard-quick__icon is-${item.tone}`}><Icon aria-hidden="true" size={15} /></span><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight aria-hidden="true" size={14} /></button>;
        })}
      </div>
    </section>
  );
}

export function HourlyOccupancyChart({ items = [] }) {
  const max = Math.max(1, ...items.map((item) => item.rate));
  return (
    <section className="admin-insight-card admin-dashboard-occupancy">
      <header className="admin-insight-card__header"><div><Clock3 aria-hidden="true" size={17} /><h2>Ocupação por horário - Hoje</h2></div></header>
      {items.length ? <div className="admin-dashboard-occupancy__bars">{items.map((item) => <div key={item.label} title={`${item.label}: ${item.rate}% ocupado`}><strong>{item.rate}%</strong><span><i style={{ height: `${Math.max(item.rate ? 12 : 3, (item.rate / max) * 100)}%` }} /></span><small>{item.label}</small></div>)}</div> : <EmptyChart text="Não há horários cadastrados para hoje." />}
    </section>
  );
}
