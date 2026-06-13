import { Coffee, Droplets, Lightbulb, UsersRound } from "lucide-react";
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
    title: "Para todos os níveis",
    description: "Do primeiro treino ao campeonato entre amigos.",
  },
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
          <div className="about__stamp" aria-label="Aberto todos os dias">
            <strong>7/7</strong>
            <span>dias de areia</span>
          </div>
        </div>

        <div className="about__content">
          <SectionHeading
            eyebrow="Sobre a arena"
            title="MAIS QUE QUADRA. UM PONTO DE ENCONTRO."
            description="A Arena Onda nasceu para aproximar esporte, bem-estar e gente boa. Aqui, cada detalhe foi pensado para você chegar, jogar e querer ficar."
          />
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
