import { useEffect, useState } from "react";
import { CalendarDays, Menu, Waves, X } from "lucide-react";
import { Button } from "./Button";

const links = [
  { label: "Modalidades", href: "#modalidades" },
  { label: "Quadras", href: "#quadras" },
  { label: "A arena", href: "#sobre" },
  { label: "Contato", href: "#contato" },
];

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

  return (
    <header className={`site-header ${scrolled ? "site-header--scrolled" : ""}`}>
      <a className="brand" href="#inicio" aria-label="Arena Onda, início">
        <span className="brand__mark">
          <Waves aria-hidden="true" size={25} strokeWidth={2.4} />
        </span>
        <span className="brand__name">
          ARENA <strong>ONDA</strong>
        </span>
      </a>

      <nav
        className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}
        aria-label="Navegação principal"
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
        <Button
          className="site-nav__mobile-cta"
          onClick={() => {
            closeMenu();
            onReserve();
          }}
        >
          Reservar agora
        </Button>
      </nav>

      <Button className="site-header__cta" onClick={onReserve}>
        <CalendarDays aria-hidden="true" size={18} />
        Reservar quadra
      </Button>

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
