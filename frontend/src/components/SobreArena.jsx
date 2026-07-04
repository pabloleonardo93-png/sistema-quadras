import { Coffee, Droplets, Lightbulb, UsersRound } from "lucide-react";
import { brand } from "../constants/brand";
import { SectionHeading } from "./SectionHeading";

const features = [
  {
    icon: Lightbulb,
    title: "Iluminação LED",
    description: "Visibilidade uniforme para jogar bem até o último horário.",
  },
  {
    icon: Droplets,
    title: "Areia tratada",
    description: "Manutenção diária para conforto, higiene e boa performance.",
  },
  {
    icon: Coffee,
    title: "Área de convivência",
    description: "Espaço para recuperar o fôlego e acompanhar as partidas.",
  },
  {
    icon: UsersRound,
    title: "Jogo para grupos",
    description: "Do treino casual ao campeonato entre amigos.",
  },
];

const metrics = [
  { value: "08h", label: "abertura" },
  { value: "22h", label: "fechamento" },
  { value: "100%", label: "agenda online" },
];

export function SobreArena() {
  return (
    <section className="section about" id="sobre">
      <div className="page-shell about__layout">
        <div className="about__visual">
          <div className="about__image">
            <img
              src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1400&q=85"
              alt="Partida de vôlei em uma quadra esportiva"
            />
          </div>
          <div className="about__stamp" aria-label="Aberto de terça a domingo">
            <strong>6/7</strong>
            <span>terça a domingo</span>
          </div>
        </div>

        <div className="about__content">
          <SectionHeading
            eyebrow="Sobre o espaço"
            title="ESTRUTURA PARA JOGAR, FICAR E VOLTAR."
            description={`O ${brand.name} aproxima esporte, sol e bons encontros. A experiência foi pensada para você escolher o horário, chegar com tranquilidade e aproveitar a partida.`}
          />
          <div className="about__metrics" aria-label="Resumo da estrutura">
            {metrics.map((metric) => (
              <span key={metric.label}>
                <strong>{metric.value}</strong>
                {metric.label}
              </span>
            ))}
          </div>
          <div className="about__features">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <Icon aria-hidden="true" size={24} strokeWidth={1.8} />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
