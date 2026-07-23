import { ArrowUpRight, CalendarHeart, Medal, UsersRound } from "lucide-react";
import { Button } from "./Button";
import { SectionHeading } from "./SectionHeading";

const eventFormats = [
  {
    icon: Medal,
    title: "Torneios e rankings",
    description: "Formato preparado para receber disputas internas, desafios e jogos recorrentes.",
  },
  {
    icon: UsersRound,
    title: "Confraternizações",
    description: "Reservas especiais para grupos que querem reunir esporte e convivência.",
  },
  {
    icon: CalendarHeart,
    title: "Datas fechadas",
    description: "Agenda flexível para combinar horários, quadras e necessidades do grupo.",
  },
];

export function EventosSection({ onReserve }) {
  return (
    <section className="section events" id="eventos" data-scroll-fade-section>
      <div className="page-shell events__layout">
        <div className="events__intro" data-scroll-fade>
          <SectionHeading
            eyebrow="Eventos e grupos"
            title="QUANDO O JOGO PEDE MAIS ARENA."
            description="Para torneios, confraternizações e reservas especiais, a estrutura fica pronta para organizar a experiência com mais cuidado."
            inverse
          />
          <Button className="events__button" onClick={onReserve}>
            Consultar disponibilidade
            <ArrowUpRight aria-hidden="true" size={18} />
          </Button>
        </div>

        <div className="events__cards">
          {eventFormats.map(({ icon: Icon, title, description }) => (
            <article className="event-card" key={title} data-scroll-fade>
              <Icon aria-hidden="true" size={28} strokeWidth={1.8} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
