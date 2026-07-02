import { CalendarCheck, CheckCircle2, MousePointer2 } from "lucide-react";
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
    description: "O site consulta os horários disponíveis direto na API do complexo.",
  },
  {
    icon: CheckCircle2,
    title: "Envie a reserva",
    description: "Informe seus dados e aguarde a confirmação da equipe.",
  },
];

export function ComoReservarSection({ onReserve }) {
  return (
    <section className="section reservation-steps" id="como-reservar">
      <div className="page-shell reservation-steps__layout">
        <SectionHeading
          eyebrow="Reserva sem atrito"
          title="DA ESCOLHA AO JOGO EM TRÊS PASSOS."
          description="Um fluxo direto para organizar a partida sem conversa perdida, planilha paralela ou dúvida sobre disponibilidade."
        />

        <div className="reservation-steps__grid">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <article className="reservation-step" key={title}>
              <span className="reservation-step__number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon aria-hidden="true" size={28} strokeWidth={1.8} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <button className="reservation-steps__cta" type="button" onClick={onReserve}>
          Começar reserva
        </button>
      </div>
    </section>
  );
}
