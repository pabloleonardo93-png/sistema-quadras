import { useLayoutEffect, useRef } from "react";
import { ArrowDown, Sun } from "lucide-react";
import { gsap } from "gsap";
import { Button } from "./Button";

const tickerItems = [
  "03 quadras premium",
  "Beach Tennis",
  "Futevôlei",
  "Vôlei de Areia",
  "Confraternizações",
  "Areia tratada",
  "Iluminação profissional",
  "Agenda online",
];

export function HeroSection({ onExploreCourts, onReserve }) {
  const tickerRef = useRef(null);

  useLayoutEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return undefined;

    const textItems = Array.from(
      ticker.querySelectorAll(".hero__ticker-track--desktop .hero__ticker-text"),
    );
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        {
          canAnimate: "(prefers-reduced-motion: no-preference)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        ({ conditions }) => {
          gsap.set(textItems, {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            yPercent: 0,
          });

          if (conditions.reduceMotion) return undefined;

          const visibleItems = textItems.filter(
            (item) => item.getClientRects().length > 0,
          );
          if (visibleItems.length === 0) return undefined;

          const timeline = gsap.timeline({
            repeat: -1,
            repeatDelay: 2.5,
            delay: 2.5,
          });

          timeline
            .to(visibleItems, {
              autoAlpha: 0,
              clipPath: "inset(0% 0% 0% 100%)",
              duration: 0.55,
              ease: "power3.inOut",
              stagger: {
                each: 0.12,
                from: "start",
              },
            })
            .set(visibleItems, {
              autoAlpha: 0,
              clipPath: "inset(100% 0% 0% 0%)",
              yPercent: 110,
            })
            .to(
              visibleItems,
              {
                autoAlpha: 1,
                clipPath: "inset(0% 0% 0% 0%)",
                yPercent: 0,
                duration: 0.65,
                ease: "power3.out",
                stagger: {
                  each: 0.12,
                  from: "start",
                },
              },
              "+=0.18",
            );

          return () => timeline.kill();
        },
      );
    }, ticker);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <section className="hero" id="inicio">
      <div className="hero__court-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="hero__content page-shell">
        <div className="hero__copy">
          <div className="hero__kicker">
            <Sun aria-hidden="true" size={16} />
            Seu esporte. Sua areia. Seu horário.
          </div>
          <h1>
            <span className="hero__title-line hero__title-line--primary">
              <span className="hero__title-word">A</span>{" "}
              <span className="hero__title-word">PARTIDA</span>
            </span>
            <span className="hero__title-line hero__title-line--accent">
              <span className="hero__title-word">COMEÇA</span>{" "}
              <span className="hero__title-word">AQUI.</span>
            </span>
          </h1>
          <p>
            Reserve online, acompanhe a disponibilidade real e chegue com a
            partida organizada para jogar mais.
          </p>
          <div className="hero__actions">
            <Button onClick={onReserve} showArrow>
              Reservar agora
            </Button>
            <a
              className="button button--primary"
              href="#quadras"
              onClick={(event) => {
                event.preventDefault();
                onExploreCourts?.();
              }}
            >
              <span>Conhecer as quadras</span>
              <ArrowDown aria-hidden="true" size={17} />
            </a>
          </div>
          <div className="hero__proof-row" aria-label="Informações principais">
            <span>
              <strong>Terça a domingo</strong>
              Agenda aberta
            </span>
            <span>
              <strong>08h às 22h</strong>
              Funcionamento
            </span>
            <span>
              <strong>Reserva online</strong>
              Pix ou cartão no checkout
            </span>
          </div>
        </div>

      </div>

      <div
        className="hero__ticker"
        aria-label="Destaques do complexo"
        ref={tickerRef}
      >
        <div className="hero__ticker-track hero__ticker-track--desktop">
          {tickerItems.map((item) => (
            <span className="hero__ticker-item" key={item}>
              <span className="hero__ticker-text">{item}</span>
            </span>
          ))}
        </div>
        <div className="hero__ticker-track hero__ticker-track--mobile" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div className="hero__ticker-group" key={copy}>
              {tickerItems.map((item) => (
                <span className="hero__ticker-item" key={`${copy}-${item}`}>
                  <span className="hero__ticker-text">{item}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
