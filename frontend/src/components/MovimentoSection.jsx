import { useLayoutEffect, useMemo, useRef } from "react";
import { ArrowLeft, ArrowRight, Grid3X3, Ruler, Umbrella } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { registrarCliqueReserva } from "../services/analyticsService";

gsap.registerPlugin(ScrollTrigger);

const fallbackCourts = [
  {
    id: "1",
    name: "Areia 01",
    subtitle: "Quadra central",
    image: "/images/quadras/areia-01.jpeg",
    description:
      "A quadra principal concentra o ritmo da arena: areia nivelada, cobertura alta e uma leitura clara para partidas de beach tennis, futevolei e volei.",
    structure: "Jogo principal",
    valorHora: 90,
    modalities: ["Beach Tennis", "Futevolei", "Volei de Areia"],
  },
  {
    id: "2",
    name: "Areia 02",
    subtitle: "Quadra panoramica",
    image: "/images/quadras/areia-02.jpeg",
    description:
      "A panoramica abre a estrutura para quem gosta de espaco, luz e circulacao. Rede montada, piso preparado e jogo fluindo sem excesso.",
    structure: "Vista aberta",
    valorHora: 85,
    modalities: ["Beach Tennis", "Futevolei", "Volei de Areia"],
  },
  {
    id: "3",
    name: "Areia 03",
    subtitle: "Quadra de treino",
    image: "/images/quadras/areia-03.webp",
    description:
      "A coberta fecha a sequencia com uma area versatil para treino, jogos fechados e fundamentos. Menos distracao, mais repeticao de qualidade.",
    structure: "Treino e jogos",
    valorHora: 75,
    modalities: ["Beach Tennis", "Futevolei", "Volei de Areia"],
  },
];

function formatPrice(value) {
  return Number(value || 0)
    .toFixed(2)
    .replace(".", ",");
}

function buildCourtStory(court, index) {
  const fallback = fallbackCourts[index];
  const source = court || fallback;
  const modalities = source.modalities?.length ? source.modalities : fallback.modalities;

  return {
    id: source.id || fallback.id,
    number: String(index + 1).padStart(2, "0"),
    name: source.name || fallback.name,
    subtitle: source.subtitle || fallback.subtitle,
    image: source.image || fallback.image,
    description: source.description || fallback.description,
    price: formatPrice(source.valorHora || fallback.valorHora),
    specs: [
      { icon: Ruler, label: "Piso", value: "Areia nivelada" },
      { icon: Umbrella, label: "Cobertura", value: "Estrutura coberta" },
      {
        icon: Grid3X3,
        label: "Estrutura",
        value: source.structure || modalities.join(" / "),
      },
    ],
  };
}

export function MovimentoSection({ courts = [] }) {
  const sectionRef = useRef(null);
  const progressRef = useRef(null);
  const storyCourts = useMemo(
    () => fallbackCourts.map((_, index) => buildCourtStory(courts[index], index)),
    [courts],
  );

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        {
          canAnimate: "(min-width: 761px) and (prefers-reduced-motion: no-preference)",
          reduceMotion: "(max-width: 760px), (prefers-reduced-motion: reduce)",
        },
        ({ conditions }) => {
          const chapters = gsap.utils.toArray(".court-chapter");
          const progress = progressRef.current;

          gsap.set(progress, { scaleX: 0.34, transformOrigin: "left center" });

          if (!conditions.canAnimate) {
            gsap.set(chapters, { clearProps: "all" });
            gsap.set(progress, { clearProps: "all" });
            return undefined;
          }

          gsap.set(chapters, { autoAlpha: 0, pointerEvents: "none" });
          gsap.set(chapters[0], { autoAlpha: 1, pointerEvents: "auto" });

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.85,
            },
          });

          chapters.forEach((chapter, index) => {
            const copy = chapter.querySelector(".court-chapter__copy");
            const mediaEl = chapter.querySelector(".court-chapter__media");
            const image = chapter.querySelector(".court-chapter__media img");
            const isSecond = chapter.classList.contains("court-chapter--second");
            const start = index;

            const copyFrom = { y: 24, x: isSecond ? 28 : -28 };
            const mediaFrom = { y: 0, x: isSecond ? -70 : 70 };
            const mediaOut = { y: -16, x: isSecond ? 46 : -46 };

            timeline
              .set(chapter, { autoAlpha: 1, pointerEvents: "auto" }, start)
              .fromTo(
                copy,
                { autoAlpha: 0, ...copyFrom },
                { autoAlpha: 1, x: 0, y: 0, duration: 0.34 },
                start,
              )
              .fromTo(
                mediaEl,
                { autoAlpha: 0, ...mediaFrom },
                { autoAlpha: 1, x: 0, y: 0, duration: 0.52 },
                start + 0.04,
              )
              .fromTo(
                image,
                { scale: 1.08 },
                { scale: 1, duration: 0.72 },
                start + 0.04,
              )
              .to(
                progress,
                { scaleX: (index + 1) / chapters.length, duration: 0.36 },
                start,
              );

            if (index < chapters.length - 1) {
              timeline
                .to(copy, { autoAlpha: 0, y: -22, duration: 0.24 }, start + 0.76)
                .to(
                  mediaEl,
                  { autoAlpha: 0, ...mediaOut, duration: 0.28 },
                  start + 0.78,
                )
                .set(chapter, { pointerEvents: "none" }, start + 0.99);
            } else {
              timeline.to(chapter, { autoAlpha: 1, duration: 0.42 }, start + 0.7);
            }
          });

          return () => timeline.kill();
        },
      );
    }, section);

    return () => {
      media.revert();
      context.revert();
    };
  }, [storyCourts]);

  return (
    <section
      className="movement-story"
      id="experiencia"
      ref={sectionRef}
      aria-labelledby="movement-story-title"
    >
      <div className="page-shell movement-story__intro">
        <span className="movement-story__eyebrow">Quadras</span>
        <h2 id="movement-story-title">
          <span>QUADRAS DEFINIDAS</span>
          <span>PELO MOVIMENTO.</span>
        </h2>
        <p>
          Cada ambiente foi pensado para transformar a partida em rotina:
          cobertura, areia tratada, rede pronta e espaco para o jogo acontecer
          com precisao.
        </p>
      </div>

      <div className="movement-story__scroll" id="quadras">
        <div className="page-shell movement-story__pin">
          <div className="movement-story__progress" aria-hidden="true">
            <span />
            <span ref={progressRef} />
          </div>

          <div className="movement-story__chapters" aria-label="Apresentacao das quadras">
            {storyCourts.map((court, index) => {
              const modifier = index === 1 ? "second" : "first";
              const bookingUrl = `/reserva?quadra=${encodeURIComponent(court.id)}`;
              const pointsToLeft = modifier === "second";

              return (
                <article
                  className={`court-chapter court-chapter--${modifier}`}
                  key={court.number}
                >
                  <div className="court-chapter__copy">
                    <span className="court-chapter__number">{court.number}</span>
                    <p className="court-chapter__eyebrow">{court.subtitle}</p>
                    <h3>{court.name}</h3>
                    <p className="court-chapter__description">{court.description}</p>

                    <dl className="court-chapter__specs">
                      {court.specs.map((spec) => {
                        const Icon = spec.icon;

                        return (
                          <div key={spec.label}>
                            <dt>
                              <Icon aria-hidden="true" size={15} />
                              {spec.label}
                            </dt>
                            <dd>{spec.value}</dd>
                          </div>
                        );
                      })}
                    </dl>

                    <a
                      className="court-chapter__action"
                      href={bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => registrarCliqueReserva(bookingUrl)}
                    >
                      {pointsToLeft && <ArrowLeft aria-hidden="true" size={18} />}
                      <span>Reservar</span>
                      {!pointsToLeft && <ArrowRight aria-hidden="true" size={18} />}
                    </a>
                  </div>

                  <figure className="court-chapter__media">
                    <img
                      src={court.image}
                      alt={`Vista da ${court.name} no Pe na Areia`}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  </figure>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
