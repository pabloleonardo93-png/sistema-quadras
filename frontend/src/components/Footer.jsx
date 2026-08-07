import { CalendarCheck, ChevronRight, Heart, Instagram, MapPin } from "lucide-react";
import { arenaInfo } from "../constants/arenaInfo";
import { brand } from "../constants/brand";

const footerLinks = [
  { label: "Espaço", href: "/#sobre" },
  { label: "Quadras", href: "/#quadras" },
  { label: "Reservas", href: "/reserva" },
  { label: "Minhas reservas", href: "/minhas-reservas" },
  { label: "Eventos", href: "/#eventos" },
  { label: "Contato", href: "/#contato" },
];

export function Footer() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${arenaInfo.address}, ${arenaInfo.city}`,
  )}`;

  return (
    <footer className="footer" data-scroll-fade-section>
      <div className="page-shell footer__main" data-scroll-fade>
        <section className="footer__brand" aria-label={brand.name}>
          <a className="footer__brand-link" href="/#inicio">
            <img
              src="/images/logo/logo-pe-na-areia-favicon-white.png"
              alt=""
              aria-hidden="true"
            />
            <span>
              <strong>{brand.nameUpper}</strong>
              <em>beach sports</em>
            </span>
          </a>
          <p>Esporte, areia e energia boa em cada partida.</p>
          <i aria-hidden="true" />
        </section>

        <nav className="footer__section footer__nav" aria-label="Links do rodape">
          <h2>Navegação</h2>
          <ul>
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>
                  {link.label}
                  <ChevronRight aria-hidden="true" size={15} />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <section className="footer__section footer__hours">
          <h2>Funcionamento</h2>
          <div className="footer__hours-row">
            <span className="footer__icon">
              <CalendarCheck aria-hidden="true" size={24} />
            </span>
            <p>
              Terça a Domingo
              <strong>08h às 22h</strong>
            </p>
          </div>
          <a className="footer__location" href={mapsUrl} target="_blank" rel="noreferrer">
            <MapPin aria-hidden="true" size={16} />
            {arenaInfo.city}
          </a>
        </section>

        <section className="footer__section footer__follow">
          <h2>Siga a gente</h2>
          <a
            className="footer__contact-link"
            href="https://www.instagram.com/penareia.bt/"
            target="_blank"
            rel="noreferrer"
            aria-label={`Instagram do ${brand.name}`}
          >
            <span className="footer__icon">
              <Instagram aria-hidden="true" size={20} />
            </span>
            <strong>@penareia.bt</strong>
          </a>
          <a className="footer__contact-link" href={mapsUrl} target="_blank" rel="noreferrer">
            <span className="footer__icon">
              <MapPin aria-hidden="true" size={20} />
            </span>
            <strong>Como chegar</strong>
          </a>
        </section>
      </div>

      <div className="footer__base" data-scroll-fade>
        <div className="page-shell footer__base-inner">
          <span>© 2026 {brand.name}. Todos os direitos reservados.</span>
          <span className="footer__legal">
            <a href="/privacidade-e-cookies">Privacidade e Cookies</a>
            <i aria-hidden="true" />
            <span>Termos de Uso</span>
          </span>
          <span className="footer__made">
            Desenvolvido com
            <Heart aria-hidden="true" size={14} fill="currentColor" />
          </span>
        </div>
      </div>
    </footer>
  );
}
