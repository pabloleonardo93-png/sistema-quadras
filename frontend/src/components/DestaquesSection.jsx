import { CalendarDays, Clock3, MonitorCheck, Trophy } from "lucide-react";
import { arenaInfo } from "../constants/arenaInfo";
import { brand } from "../constants/brand";

function formatCount(value, fallback) {
  if (value > 0) return String(value).padStart(2, "0");
  return fallback;
}

export function DestaquesSection({
  courtsCount = 0,
  modalitiesCount = 0,
  isLoading = false,
}) {
  const highlights = [
    {
      icon: Trophy,
      value: isLoading ? "--" : formatCount(courtsCount, "03"),
      unit: "quadras",
      label: "Prontas para reserva",
      detail: "Areia cuidada e estrutura pronta para receber seu jogo.",
    },
    {
      icon: CalendarDays,
      value: isLoading ? "--" : formatCount(modalitiesCount, "03"),
      unit: "modalidades",
      label: "Para diferentes ritmos",
      detail: "Beach Tennis, Futevôlei e Vôlei de Areia.",
    },
    {
      icon: Clock3,
      value: "6",
      unit: "dias",
      label: "Agenda aberta",
      detail: arenaInfo.openingHours,
    },
    {
      icon: MonitorCheck,
      value: "ON",
      unit: "online",
      label: "Reserva pelo site",
      detail: "Escolha quadra, data e horário pelo site.",
    },
  ];

  return (
    <section className="highlights" aria-label={`Destaques do ${brand.name}`}>
      <div className="page-shell highlights__panel">
        <div className="highlights__intro">
          <span>Reserva rápida</span>
          <h2>Reserve com confiança. Jogue tranquilo.</h2>
          <p>
            Veja a estrutura, escolha um horário disponível e confirme sua
            partida com as informações principais sempre à vista.
          </p>
        </div>

        <div className="highlights__grid">
          {highlights.map(({ icon: Icon, value, unit, label, detail }) => (
            <article className="highlight-card" key={label}>
              <div className="highlight-card__top">
                <Icon aria-hidden="true" size={20} strokeWidth={2} />
                <span>{unit}</span>
              </div>
              <strong>{value}</strong>
              <h3>{label}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
