import {
  ArrowUpRight,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { arenaInfo } from "../constants/arenaInfo";
import { Button } from "./Button";

export function ContatoSection() {
  const mapsQuery = `${arenaInfo.address}, ${arenaInfo.city}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const mapsEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`;

  return (
    <section className="contact section" id="contato" data-scroll-fade-section>
      <div className="page-shell contact__layout">
        <div className="contact__content" data-scroll-fade>
          <span className="contact__eyebrow">Chegue junto</span>
          <h2>A AREIA ESTÁ TE ESPERANDO.</h2>
          <p>
            Confira o endereço, veja o caminho pelo mapa e fale com a equipe
            para tirar dúvidas sobre horários, grupos e reservas especiais.
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

        <div
          className="map-card"
          aria-label="Mapa da localização"
          data-scroll-fade
        >
          <iframe
            className="map-card__embed"
            title={`Mapa de ${mapsQuery}`}
            src={mapsEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <Button
            variant="dark"
            onClick={() =>
              window.open(
                mapsUrl,
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
