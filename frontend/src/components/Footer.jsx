import { Instagram, Waves } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="page-shell footer__top">
        <a className="brand brand--footer" href="#inicio">
          <span className="brand__mark">
            <Waves aria-hidden="true" size={25} />
          </span>
          <span className="brand__name">
            ARENA <strong>ONDA</strong>
          </span>
        </a>
        <p>Esporte, areia e energia boa em cada partida.</p>
        <nav aria-label="Links do rodapé">
          <a href="#modalidades">Modalidades</a>
          <a href="#quadras">Quadras</a>
          <a href="#reserva">Reserva</a>
          <a href="#contato">Contato</a>
        </nav>
        <a
          className="footer__social"
          href="#inicio"
          aria-label="Instagram da Arena Onda"
        >
          <Instagram aria-hidden="true" size={20} />
        </a>
      </div>
      <div className="page-shell footer__bottom">
        <span>© 2026 Arena Onda. Todos os direitos reservados.</span>
        <span>Frontend demonstrativo • Dados simulados</span>
      </div>
    </footer>
  );
}
