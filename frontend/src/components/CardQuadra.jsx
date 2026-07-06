import { ArrowRight, Check, Clock3, Wrench } from "lucide-react";

const statusIcons = {
  available: Check,
  busy: Clock3,
  maintenance: Wrench,
};

export function CardQuadra({ court }) {
  const StatusIcon = statusIcons[court.status];
  const isDisabled = court.status === "maintenance";
  const bookingUrl = `/reserva?quadra=${encodeURIComponent(court.id)}`;
  const hourlyPrice = Number(court.valorHora || 0)
    .toFixed(2)
    .replace(".", ",");

  return (
    <article
      className={`court-card${isDisabled ? " court-card--disabled" : ""}`}
      aria-label={`${court.name}. ${court.statusLabel}. ${court.detail}`}
    >
      {!isDisabled && (
        <a
          className="court-card__overlay-link"
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Reservar ${court.name}`}
        />
      )}
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
        <p className="court-card__price">
          <span>Valor da reserva</span>
          <strong>R$ {hourlyPrice}</strong>
          <small>por horário</small>
        </p>
        <div className="court-card__tags">
          {court.modalities.map((modality) => (
            <span key={modality}>{modality}</span>
          ))}
        </div>
        {isDisabled ? (
          <span className="court-card__action court-card__action--disabled" aria-disabled="true">
            Indisponível
          </span>
        ) : (
          <span
            className="court-card__action"
            aria-hidden="true"
          >
            Reservar esta quadra
            <ArrowRight aria-hidden="true" size={18} />
          </span>
        )}
      </div>
    </article>
  );
}
