import { ArrowRight, Check, Clock3, Wrench } from "lucide-react";

const statusIcons = {
  available: Check,
  busy: Clock3,
  maintenance: Wrench,
};

export function CardQuadra({ court, onReserve }) {
  const StatusIcon = statusIcons[court.status];
  const isDisabled = court.status === "maintenance";

  return (
    <article className="court-card">
      <div className="court-card__image">
        <img src={court.image} alt={`Vista da ${court.name}`} />
        <span className={`status status--${court.status}`}>
          <StatusIcon aria-hidden="true" size={14} strokeWidth={2.5} />
          {court.statusLabel}
        </span>
        <span className="court-card__index">{court.id.slice(-1)}</span>
      </div>
      <div className="court-card__content">
        <span className="court-card__eyebrow">{court.subtitle}</span>
        <h3>{court.name}</h3>
        <p>{court.detail}</p>
        <div className="court-card__tags">
          {court.modalities.map((modality) => (
            <span key={modality}>{modality}</span>
          ))}
        </div>
        <button
          className="court-card__action"
          type="button"
          disabled={isDisabled}
          onClick={() => onReserve(court.id)}
        >
          {isDisabled ? "Indisponível" : "Reservar esta quadra"}
          {!isDisabled && <ArrowRight aria-hidden="true" size={18} />}
        </button>
      </div>
    </article>
  );
}
