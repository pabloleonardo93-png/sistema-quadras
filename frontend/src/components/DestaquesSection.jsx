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
      label: "quadras preparadas",
      detail: "Espaços cadastrados para reserva",
    },
    {
      icon: CalendarDays,
      value: isLoading ? "--" : formatCount(modalitiesCount, "03"),
      label: "modalidades",
      detail: "Opções para diferentes ritmos de jogo",
    },
    {
      icon: Clock3,
      value: "7/7",
      label: "dias de agenda",
      detail: arenaInfo.openingHours,
    },
    {
      icon: MonitorCheck,
      value: "ON",
      label: "reserva online",
      detail: "Escolha quadra, data e horário pelo site",
    },
  ];

  return (
    <section className="highlights" aria-label={`Destaques do ${brand.name}`}>
      <div className="page-shell highlights__grid">
        {highlights.map(({ icon: Icon, value, label, detail }) => (
          <article className="highlight-card" key={label}>
            <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
            <strong>{value}</strong>
            <span>{label}</span>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
