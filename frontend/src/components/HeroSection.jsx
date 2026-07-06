import {
  ArrowDown,
  CalendarCheck,
  Clock3,
  MapPin,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { arenaInfo } from "../constants/arenaInfo";
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

export function HeroSection({ onReserve }) {
  const todayLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date())
    .replace(".", "")
    .toUpperCase();

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
            A PARTIDA
            <span>COMEÇA AQUI.</span>
          </h1>
          <p>
            Reserve online, acompanhe a disponibilidade real e chegue com a
            partida organizada para jogar mais.
          </p>
          <div className="hero__actions">
            <Button onClick={onReserve} showArrow>
              Reservar agora
            </Button>
            <a className="text-link" href="#quadras">
              Conhecer as quadras
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

        <aside className="match-card" aria-label="Informações rápidas">
          <div className="match-card__header">
            <span>Próximo jogo</span>
            <span className="live-pill">Agenda aberta</span>
          </div>
          <div className="match-card__date">
            <span className="match-card__day">HOJE</span>
            <strong>{todayLabel}</strong>
          </div>
          <div className="match-card__divider" />
          <ul>
            <li>
              <Clock3 aria-hidden="true" size={18} />
              <span>
                <small>Funcionamento</small>
                {arenaInfo.openingHours}
              </span>
            </li>
            <li>
              <MapPin aria-hidden="true" size={18} />
              <span>
                <small>Localização</small>
                Jardim Atlântico
              </span>
            </li>
            <li>
              <ShieldCheck aria-hidden="true" size={18} />
              <span>
                <small>Estrutura</small>
                Segura e completa
              </span>
            </li>
          </ul>
          <Button variant="dark" onClick={onReserve}>
            <CalendarCheck aria-hidden="true" size={18} />
            Ver horários
          </Button>
        </aside>
      </div>

      <div className="hero__ticker" aria-label="Destaques do complexo">
        <div className="hero__ticker-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span className="hero__ticker-item" key={`${item}-${index}`}>
              {item}
              <i aria-hidden="true" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
