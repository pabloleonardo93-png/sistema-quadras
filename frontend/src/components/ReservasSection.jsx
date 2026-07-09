import {
  ArrowUpRight,
  Banknote,
  ClipboardList,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { whatsappLink } from "../utils/contactLinks";
import { SectionHeading } from "./SectionHeading";

const reservationMessage =
  "Olá, quero fazer uma reserva de horário no Pé na Areia.";

const bookingUrl = "/reserva";

export function ReservasSection({ courts = [] }) {
  const minCourtPrice = courts
    .map((court) => Number(court.valorHora || 0))
    .filter(Boolean)
    .sort((a, b) => a - b)[0];

  const priceLabel = minCourtPrice
    ? `A partir de R$ ${minCourtPrice.toFixed(2).replace(".", ",")} por horário`
    : "Confira o valor antes de confirmar";

  return (
    <section className="section reservations-flow" id="reservas">
      <div className="page-shell reservations-flow__layout">
        <div className="reservations-flow__content">
          <SectionHeading
            eyebrow="Reservas"
            title="RESERVE E PAGUE COM VALOR CERTO."
            description="Escolha quadra, data e horário. O sistema calcula o valor e abre o checkout seguro do Mercado Pago."
            inverse
          />
          <div className="reservations-flow__note">
            <strong>Status da reserva</strong>
            <p>
              Cada reserva gera um pagamento próprio. O horário fica pendente
              até o retorno do Mercado Pago confirmar a transação.
            </p>
          </div>
        </div>

        <div className="reservations-flow__actions">
          <a
            className="reservation-action reservation-action--primary"
            href={bookingUrl}
          >
            <ClipboardList aria-hidden="true" size={24} />
            <span>
              <strong>Reservar e pagar</strong>
              <small>Escolher quadra, data e horário</small>
            </span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>

          <div className="reservation-action reservation-action--info">
            <CreditCard aria-hidden="true" size={24} />
            <span>
              <strong>Checkout seguro</strong>
              <small>Pix ou cartão quando disponíveis</small>
            </span>
          </div>

          <a
            className="reservation-action"
            href={whatsappLink(reservationMessage)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle aria-hidden="true" size={24} />
            <span>
              <strong>Falar no WhatsApp</strong>
              <small>Mensagem pronta para atendimento</small>
            </span>
            <ArrowUpRight aria-hidden="true" size={18} />
          </a>

          <div className="reservation-action reservation-action--info">
            <Banknote aria-hidden="true" size={24} />
            <span>
              <strong>Preço claro</strong>
              <small>{priceLabel}</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
