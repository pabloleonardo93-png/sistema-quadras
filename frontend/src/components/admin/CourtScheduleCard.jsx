import { ChevronRight, Landmark } from "lucide-react";

export default function CourtScheduleCard({
  formatTime,
  group,
  onCourtDetails,
  onSlotAction,
  savingSlotId,
  statusClass,
  statusLabel,
}) {
  return (
    <article className="admin-court-schedule-card">
      <header>
        <div>
          <span className="admin-court-schedule-card__icon">
            <Landmark aria-hidden="true" size={22} />
          </span>
          <div>
            <h3>{group.court}</h3>
            <p>{group.modalidades.length ? group.modalidades.map((modalidade) => modalidade.nome).join(" · ") : "Modalidades não informadas"}</p>
          </div>
        </div>
        <button type="button" disabled={!onCourtDetails} onClick={() => onCourtDetails?.(group)}>
          <span>Ver detalhes da quadra</span>
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </header>

      <div className="admin-schedule-slot-grid">
        {group.slots.map((slot) => {
          const isSaving = savingSlotId === slot.id;
          const disabled = slot.status === "reservado" || isSaving;

          return (
            <button
              className={`admin-schedule-slot admin-schedule-slot--${statusClass(slot.status)}`}
              disabled={disabled}
              key={slot.id}
              type="button"
              title={
                slot.status === "reservado"
                  ? "Horário reservado"
                  : slot.status === "bloqueado"
                    ? "Clique para liberar o horário"
                    : "Clique para bloquear temporariamente"
              }
              onClick={() => onSlotAction(slot)}
            >
              <strong>{formatTime(slot.horaInicio)}</strong>
              <span>{isSaving ? "Atualizando..." : statusLabel(slot.status)}</span>
              {slot.reserva?.cliente?.nome && <small>{slot.reserva.cliente.nome}</small>}
              {slot.observacao && <small>{slot.observacao}</small>}
            </button>
          );
        })}
      </div>
    </article>
  );
}
