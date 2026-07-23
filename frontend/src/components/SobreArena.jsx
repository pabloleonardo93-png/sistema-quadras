import { useEffect, useState } from "react";
import { Coffee, Droplets, Lightbulb, UsersRound } from "lucide-react";
import { brand } from "../constants/brand";
import { SectionHeading } from "./SectionHeading";

const gallerySlides = [
  {
    src: "/images/experiencia/beach-tennis-em-acao.jpg?v=20260718-2",
    alt: "Jogadora preparando um saque de beach tennis na quadra do Pé na Areia",
    category: "Beach Tennis",
    caption: "Precisão, energia e areia.",
    modifier: "beach",
  },
  {
    src: "/images/experiencia/futevolei-em-acao.jpg?v=20260718-2",
    alt: "Atleta saltando para disputar a bola em uma partida de futevôlei",
    category: "Futevôlei",
    caption: "Jogo no alto, arena completa.",
    modifier: "futevolei",
  },
];

const galleryInterval = 3000;

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

export function SobreArena() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % gallerySlides.length);
    }, galleryInterval);

    return () => window.clearInterval(timer);
  }, []);

  const advanceOnHover = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActiveSlide((current) => (current + 1) % gallerySlides.length);
  };

  return (
    <section className="section about" id="sobre" data-scroll-fade-section>
      <div className="page-shell about__layout">
        <div
          className="about__visual"
          role="region"
          aria-roledescription="carrossel"
          aria-label="Esportes e experiências no Pé na Areia"
          onMouseEnter={advanceOnHover}
          data-scroll-fade
        >
          <div className="about__image">
            {gallerySlides.map((slide, index) => (
              <figure
                className={`about__slide about__slide--${slide.modifier} ${
                  index === activeSlide ? "is-active" : ""
                }`}
                aria-hidden={index !== activeSlide}
                key={slide.src}
              >
                <img
                  src={slide.src}
                  alt={index === activeSlide ? slide.alt : ""}
                  loading="eager"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
              </figure>
            ))}

            <span className="about__gallery-kicker">Pé na Areia / Em movimento</span>

            <div className="about__gallery-caption" aria-hidden="true">
              <span>{gallerySlides[activeSlide].category}</span>
              <strong>{gallerySlides[activeSlide].caption}</strong>
            </div>

          </div>
        </div>

        <div className="about__content">
          <div data-scroll-fade>
            <SectionHeading
            eyebrow="Sobre o espaço"
            title={
              <>
                ESPAÇO PRONTO PARA O SEU <span>MELHOR JOGO.</span>
              </>
            }
            description={`O ${brand.name} aproxima esporte, sol e bons encontros. A experiência foi pensada para você escolher o horário, chegar com tranquilidade e aproveitar a partida.`}
            />
          </div>

          <div
            className="about__features"
            aria-label="Diferenciais da estrutura"
            data-scroll-fade
          >
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span className="about__feature-icon">
                  <Icon aria-hidden="true" size={20} strokeWidth={1.9} />
                </span>
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
