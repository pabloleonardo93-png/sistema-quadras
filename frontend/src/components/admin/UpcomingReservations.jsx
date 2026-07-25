import { CalendarDays, ChevronRight, MoreVertical } from "lucide-react";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

export default function UpcomingReservations({
  onOpenAgenda,
  onOpenReservations,
  reservations = [],
}) {
  return (
    <section className="admin-panel admin-upcoming-reservations">
      <header className="admin-panel-heading">
        <div>
          <span className="admin-panel-heading__icon">
            <CalendarDays aria-hidden="true" size={19} />
          </span>
          <h2>Próximas reservas</h2>
        </div>
        <button type="button" onClick={onOpenAgenda}>
          <CalendarDays aria-hidden="true" size={17} />
          <span>Ver agenda</span>
        </button>
      </header>

      {reservations.length ? (
        <>
          <div className="admin-upcoming-list">
            {reservations.map((reservation) => (
              <article className="admin-upcoming-card" key={reservation.id}>
                <div className="admin-upcoming-card__time">
                  <strong>{reservation.time}</strong>
                  <small>{reservation.date}</small>
                </div>
                <span className="admin-upcoming-card__avatar">{reservation.initials}</span>
                <div className="admin-upcoming-card__client">
                  <strong>{reservation.clientName}</strong>
                  <small>{reservation.modality}</small>
                </div>
                <div className="admin-upcoming-card__court">
                  <strong>{reservation.court}</strong>
                  {reservation.floorType && <small>{reservation.floorType}</small>}
                </div>
                <StatusBadge status={reservation.statusLabel} />
                <button
                  className="admin-upcoming-card__action"
                  type="button"
                  aria-label={`Abrir ações da reserva ${reservation.id}`}
                  title="Ver ações em Reservas"
                  onClick={onOpenReservations}
                >
                  <MoreVertical aria-hidden="true" size={19} />
                </button>
              </article>
            ))}
          </div>

          <button className="admin-upcoming-reservations__all" type="button" onClick={onOpenReservations}>
            <span>Ver todas as reservas</span>
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </>
      ) : (
        <EmptyState
          title="Nenhuma próxima reserva"
          description="As reservas futuras aparecerão aqui assim que existirem na agenda."
          action="Ver agenda"
          onAction={onOpenAgenda}
        />
      )}
    </section>
  );
}
