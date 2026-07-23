import { CalendarCheck, CheckCircle2, MousePointer2 } from "lucide-react";
import { Button } from "./Button";
import { SectionHeading } from "./SectionHeading";

const steps = [
  {
    icon: MousePointer2,
    title: "Escolha o jogo",
    description: "Selecione modalidade, quadra e a melhor data para sua partida.",
  },
  {
    icon: CalendarCheck,
    title: "Veja a agenda",
    description: "O site consulta os horários disponíveis direto no sistema do complexo.",
  },
  {
    icon: CheckCircle2,
    title: "Finalize no checkout",
    description: "Informe seus dados e conclua o pagamento seguro para confirmar.",
  },
];

export function ComoReservarSection({ onReserve }) {
  return (
    <section
      className="section reservation-steps"
      id="como-reservar"
      data-scroll-fade-section
    >
      <div className="page-shell reservation-steps__layout">
        <div data-scroll-fade>
          <SectionHeading
            eyebrow="Reserva sem atrito"
            title="DA ESCOLHA AO JOGO EM TRÊS PASSOS."
            description="Um fluxo direto para organizar a partida sem conversa perdida, planilha paralela ou dúvida sobre disponibilidade."
          />
        </div>

        <div className="reservation-steps__grid">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <article className="reservation-step" key={title} data-scroll-fade>
              <span className="reservation-step__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon aria-hidden="true" size={28} strokeWidth={1.8} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <Button
          className="reservation-steps__cta"
          onClick={onReserve}
          data-scroll-fade
        >
          Começar reserva
        </Button>
      </div>
    </section>
  );
}
