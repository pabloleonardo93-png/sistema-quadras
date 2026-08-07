import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { brand } from "../constants/brand";

const links = [
  { label: "Quadras", href: "#quadras" },
  { label: "Reservas", href: "#quadras-disponiveis" },
  { label: "Minhas reservas", href: "/minhas-reservas" },
  { label: "Espaço", href: "#sobre" },
  { label: "Eventos", href: "#eventos" },
  { label: "Contato", href: "#contato" },
];

const reservationHash = "#quadras-disponiveis";

export function Header({ onReserve }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const handleReserveClick = (event) => {
    closeMenu();

    if (!onReserve) return;

    event.preventDefault();
    onReserve();
  };

  const handleNavClick = (event, href) => {
    if (href === reservationHash) {
      handleReserveClick(event);
      return;
    }

    closeMenu();
  };

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <a className="brand brand--image" href="#inicio" aria-label={`${brand.name}, início`}>
        <img
          className="brand__logo-image"
          src="/images/logo/logo-pe-na-areia-header-white.png"
          alt={brand.name}
        />
      </a>

      <nav
        className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}
        aria-label="Navegação principal"
      >
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(event) => handleNavClick(event, link.href)}
          >
            {link.label}
          </a>
        ))}
        <a
          className="button button--primary site-nav__mobile-cta"
          href={reservationHash}
          onClick={handleReserveClick}
        >
          <span>Reservar agora</span>
        </a>
      </nav>

      <a
        className="button button--primary site-header__cta"
        href={reservationHash}
        onClick={handleReserveClick}
      >
        <span>Reservar quadra</span>
      </a>

      <button
        className="menu-toggle"
        type="button"
        onClick={() => setMenuOpen((current) => !current)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
    </header>
  );
}
