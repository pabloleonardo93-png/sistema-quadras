import { useEffect, useState } from "react";
import { CalendarDays, Menu, X } from "lucide-react";
import { brand } from "../constants/brand";
import { BrandMark } from "./BrandMark";

const links = [
  { label: "Modalidades", href: "#modalidades" },
  { label: "Quadras", href: "#quadras" },
  { label: "Reservas", href: "#quadras" },
  { label: "O espaço", href: "#sobre" },
  { label: "Eventos", href: "#eventos" },
  { label: "Contato", href: "#contato" },
];

export function Header() {
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
      <a className="brand" href="#inicio" aria-label={`${brand.name}, início`}>
        <span className="brand__mark">
          <BrandMark title={brand.name} />
        </span>
        <span className="brand__name">
          PÉ NA <strong>AREIA</strong>
        </span>
      </a>

      <nav
        className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}
        aria-label="Navegação principal"
      >
        {links.map((link) => (
          <a key={link.label} href={link.href} onClick={closeMenu}>
            {link.label}
          </a>
        ))}
        <a
          className="button button--primary site-nav__mobile-cta"
          href="#quadras"
          onClick={closeMenu}
        >
          <span>Reservar agora</span>
        </a>
      </nav>

      <a
        className="button button--primary site-header__cta"
        href="#quadras"
      >
        <CalendarDays aria-hidden="true" size={18} />
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
