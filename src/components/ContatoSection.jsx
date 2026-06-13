import {
  ArrowUpRight,
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import { arenaInfo } from "../data/mockData";
import { Button } from "./Button";

export function ContatoSection() {
  return (
    <section className="contact section" id="contato">
      <div className="page-shell contact__layout">
        <div className="contact__content">
          <span className="contact__eyebrow">Chegue junto</span>
          <h2>A AREIA ESTÁ TE ESPERANDO.</h2>
          <p>
            Estamos a poucos minutos das principais avenidas da região, com
            estacionamento e acesso fácil.
          </p>

          <div className="contact__items">
            <div>
              <MapPin aria-hidden="true" />
              <span>
                <small>Endereço</small>
                {arenaInfo.address}
                <em>{arenaInfo.city}</em>
              </span>
            </div>
            <div>
              <Clock3 aria-hidden="true" />
              <span>
                <small>Funcionamento</small>
                {arenaInfo.openingHours}
              </span>
            </div>
            <div>
              <Phone aria-hidden="true" />
              <span>
                <small>Contato</small>
                {arenaInfo.phone}
              </span>
            </div>
          </div>

          <a
            className="button button--whatsapp"
            href={`https://wa.me/${arenaInfo.whatsapp}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle aria-hidden="true" size={19} />
            <span>Chamar no WhatsApp</span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>
        </div>

        <div className="map-card" aria-label="Mapa ilustrativo da localização">
          <div className="map-card__grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="map-card__route" aria-hidden="true" />
          <div className="map-card__pin">
            <span>
              <Navigation aria-hidden="true" size={23} fill="currentColor" />
            </span>
            <strong>Arena Onda</strong>
            <small>Você chegou.</small>
          </div>
          <Button
            variant="dark"
            onClick={() =>
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${arenaInfo.address}, ${arenaInfo.city}`,
                )}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            Abrir no mapa
            <ArrowUpRight aria-hidden="true" size={18} />
          </Button>
        </div>
      </div>
    </section>
  );
}
