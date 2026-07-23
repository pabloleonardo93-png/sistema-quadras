import { useEffect } from "react";
import {
  ArrowUpRight,
  ClipboardList,
  CreditCard,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { registrarCliqueReserva, registrarVisualizacaoReserva } from "../services/analyticsService";
import { whatsappLink } from "../utils/contactLinks";
import { SectionHeading } from "./SectionHeading";

const reservationMessage =
  "Ola, quero fazer uma reserva de horario no Pe na Areia.";

const bookingUrl = "/reserva";

export function ReservasSection() {
  useEffect(() => {
    registrarVisualizacaoReserva("/#reservas");
  }, []);

  return (
    <section
      className="section reservations-flow"
      id="reservas"
      data-scroll-fade-section
    >
      <div className="page-shell reservations-flow__layout">
        <div className="reservations-flow__content" data-scroll-fade>
          <SectionHeading
            eyebrow="Reservas"
            title={
              <>
                RESERVE E PAGUE COM <span>VALOR CERTO.</span>
              </>
            }
            description="Escolha quadra, data e horario. O sistema calcula o valor e abre o checkout seguro do Mercado Pago."
            inverse
          />
          <div className="reservations-flow__note">
            <span className="reservations-flow__note-icon">
              <ShieldCheck aria-hidden="true" size={22} strokeWidth={1.8} />
            </span>
            <div>
              <strong>Pagamento confirmado, horario reservado</strong>
              <p>
                O horario fica pendente somente ate o Mercado Pago confirmar a
                transacao.
              </p>
            </div>
          </div>
        </div>

        <div className="reservations-flow__actions">
          <a
            className="reservation-action reservation-action--primary"
            href={bookingUrl}
            onClick={() => registrarCliqueReserva(bookingUrl)}
            data-scroll-fade
          >
            <span className="reservation-action__topline">
              Reserva online
              <ArrowUpRight aria-hidden="true" size={21} />
            </span>

            <span className="reservation-action__body">
              <span className="reservation-action__icon">
                <ClipboardList aria-hidden="true" size={25} strokeWidth={1.8} />
              </span>
              <strong>Escolha sua quadra e entre em jogo.</strong>
              <small>Defina modalidade, data e horario em poucos passos.</small>
            </span>
          </a>

          <div className="reservations-flow__details">
            <div className="reservations-flow__detail" data-scroll-fade>
              <span>
                <CreditCard aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Checkout seguro</strong>
                <small>Pagamento processado pelo Mercado Pago.</small>
              </div>
            </div>

            <div className="reservations-flow__detail" data-scroll-fade>
              <span>
                <ClipboardList aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Preco transparente</strong>
                <small>Confira o total antes de confirmar.</small>
              </div>
            </div>

            <a
              className="reservations-flow__detail reservations-flow__detail--link"
              href={whatsappLink(reservationMessage)}
              target="_blank"
              rel="noopener noreferrer"
              data-scroll-fade
            >
              <span>
                <MessageCircle aria-hidden="true" size={21} strokeWidth={1.8} />
              </span>
              <div>
                <strong>Prefere atendimento?</strong>
                <small>Fale com a equipe no WhatsApp.</small>
              </div>
              <ArrowUpRight
                className="reservations-flow__detail-arrow"
                aria-hidden="true"
                size={18}
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
