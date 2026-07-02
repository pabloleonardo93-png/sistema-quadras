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
  const openBooking = () => {
    if (!isDisabled) {
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleKeyDown = (event) => {
    if (!isDisabled && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      openBooking();
    }
  };

  return (
    <article
      className="court-card"
      onClick={openBooking}
      onKeyDown={handleKeyDown}
      role={isDisabled ? undefined : "link"}
      tabIndex={isDisabled ? undefined : 0}
    >
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
        {isDisabled ? (
          <span className="court-card__action court-card__action--disabled" aria-disabled="true">
            Indisponível
          </span>
        ) : (
          <a
            className="court-card__action"
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            Reservar esta quadra
            <ArrowRight aria-hidden="true" size={18} />
          </a>
        )}
      </div>
    </article>
  );
}
