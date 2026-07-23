import { ArrowRight, Check, Clock3, Wrench } from "lucide-react";
import { registrarCliqueReserva } from "../services/analyticsService";

const statusIcons = {
  available: Check,
  busy: Clock3,
  maintenance: Wrench,
};

const courtProfiles = [
  {
    match: "01",
    label: "Quadra central",
    description:
      "Ritmo forte, boa leitura da rede e estrutura coberta para partidas com mais intensidade.",
    features: ["Cobertura alta", "Areia nivelada", "Acesso rapido"],
  },
  {
    match: "02",
    label: "Quadra panoramica",
    description:
      "Vista aberta da arena, rede montada e circulacao ampla para jogos com a turma.",
    features: ["Vista ampla", "Rede montada", "Boa circulacao"],
  },
  {
    match: "03",
    label: "Quadra de treino",
    description:
      "Ambiente versatil para fundamentos, jogos fechados e treinos com mais controle.",
    features: ["Area reservada", "Treino tecnico", "Jogo em equipe"],
  },
];

function getCourtProfile(court, courtIndex) {
  const normalizedName = `${court.name || ""} ${court.subtitle || ""}`.toLowerCase();
  const profile =
    courtProfiles.find((item) => normalizedName.includes(item.match)) ||
    courtProfiles[courtIndex - 1] ||
    courtProfiles[0];

  return {
    ...profile,
    label: court.subtitle || profile.label,
  };
}

export function CardQuadra({ court, reveal = false }) {
  const StatusIcon = statusIcons[court.status];
  const isDisabled = court.status === "maintenance";
  const bookingUrl = `/reserva?quadra=${encodeURIComponent(court.id)}`;
  const courtIndex = String(court.id).padStart(2, "0").slice(-2);
  const profile = getCourtProfile(court, Number(courtIndex));
  const modalities = court.modalities?.length
    ? court.modalities
    : ["Beach Tennis", "Futevolei", "Volei de Areia"];

  return (
    <article
      className={`court-card${isDisabled ? " court-card--disabled" : ""}`}
      aria-label={`${court.name}. ${court.statusLabel}. ${profile.description}`}
      data-scroll-fade={reveal ? "" : undefined}
    >
      {!isDisabled && (
        <a
          className="court-card__overlay-link"
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Reservar ${court.name}`}
          onClick={() => registrarCliqueReserva(bookingUrl)}
        />
      )}
      <div className="court-card__image">
        <img src={court.image} alt={`Vista da ${court.name}`} />
        <span className={`status status--${court.status}`}>
          <StatusIcon aria-hidden="true" size={14} strokeWidth={2.5} />
          {court.statusLabel}
        </span>
      </div>
      <div className="court-card__content">
        <div className="court-card__heading">
          <span className="court-card__number">{courtIndex}</span>
          <span className="court-card__eyebrow">{profile.label}</span>
          <h3>{court.name}</h3>
        </div>
        <div className="court-card__booking-meta">
          <p className="court-card__description">{profile.description}</p>
          <div className="court-card__tags" aria-label="Modalidades disponiveis">
            {modalities.map((modality) => (
              <span key={modality}>{modality}</span>
            ))}
          </div>
          <ul className="court-card__features" aria-label="Caracteristicas principais">
            {profile.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        {isDisabled ? (
          <span
            className="court-card__action court-card__action--disabled"
            aria-disabled="true"
          >
            <span>Indisponivel</span>
          </span>
        ) : (
          <span className="court-card__action" aria-hidden="true">
            <span>Reservar</span>
            <ArrowRight aria-hidden="true" size={18} />
          </span>
        )}
      </div>
    </article>
  );
}
