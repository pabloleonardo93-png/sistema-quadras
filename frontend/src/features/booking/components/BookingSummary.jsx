import { CalendarCheck, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { arenaInfo } from "../../../constants/arenaInfo";
import { brand } from "../../../constants/brand";

export function BookingSummary({
  date,
  selectedCourtData,
  selectedHorario,
  selectedModality,
  valorFormatado,
}) {
  return (
    <aside className="booking-summary">
      <div className="booking-summary__label">Sua reserva</div>
      {selectedCourtData?.image && (
        <div className="booking-summary__photo">
          <img
            src={selectedCourtData.image}
            alt={`Foto da ${selectedCourtData.name}`}
          />
          <span className="booking-summary__availability">
            <i aria-hidden="true" />
            {selectedCourtData.statusLabel}
          </span>
        </div>
      )}
      <div className="booking-summary__body">
        <div className="booking-summary__court">
          <span>{selectedCourtData?.name || "Escolha a quadra"}</span>
          <small>{selectedModality || "Escolha a modalidade"}</small>
        </div>
        <div className="booking-summary__meta">
          <span>
            <CalendarCheck aria-hidden="true" size={18} />
            {date
              ? new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "short",
                }).format(new Date(`${date}T12:00:00`))
              : "--"}
          </span>
          <span>
            <Clock3 aria-hidden="true" size={18} />
            {selectedHorario?.time || "--:--"}
          </span>
        </div>
        <div className="booking-summary__location">
          <MapPin aria-hidden="true" size={18} />
          <span>
            {brand.name}
            <small>{arenaInfo.neighborhood}</small>
          </span>
        </div>
        <div className="booking-summary__price">
          <span>Valor por hora</span>
          <strong>
            <small>R$</small>
            {valorFormatado}
          </strong>
        </div>
        <p>
          <ShieldCheck aria-hidden="true" size={18} />
          Pix ou cartão em ambiente de pagamento seguro.
        </p>
      </div>
    </aside>
  );
}
