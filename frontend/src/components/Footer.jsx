import { Instagram } from "lucide-react";
import { brand } from "../constants/brand";
import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-shell footer__top">
        <a className="brand brand--footer" href="/#inicio">
          <span className="brand__mark">
            <BrandMark title={brand.name} />
          </span>
          <span className="brand__name">
            PÉ NA <strong>AREIA</strong>
          </span>
        </a>
        <p>Esporte, areia e energia boa em cada partida.</p>
        <nav aria-label="Links do rodapé">
          <a href="/#modalidades">Modalidades</a>
          <a href="/#quadras">Quadras</a>
          <a href="/#quadras">Reserva</a>
          <a href="/#eventos">Eventos</a>
          <a href="/#contato">Contato</a>
        </nav>
        <a
          className="footer__social"
          href="/#inicio"
          aria-label={`Instagram do ${brand.name}`}
        >
          <Instagram aria-hidden="true" size={20} />
        </a>
      </div>
      <div className="page-shell footer__bottom">
        <span>© 2026 {brand.name}. Todos os direitos reservados.</span>
        <span>Conectado à API do {brand.name}</span>
      </div>
    </footer>
  );
}
