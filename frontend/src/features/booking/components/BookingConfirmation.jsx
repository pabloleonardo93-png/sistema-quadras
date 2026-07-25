import { ChevronLeft, PartyPopper } from "lucide-react";
import { Button } from "../../../components/Button";

export function BookingConfirmation({
  customer,
  onReset,
  selectedCourtData,
  selectedHorario,
  selectedModality,
  successMessage,
}) {
  return (
    <div className="booking-confirmation" role="status">
      <span className="booking-confirmation__icon">
        <PartyPopper aria-hidden="true" size={34} />
      </span>
      <span className="booking-confirmation__eyebrow">
        Reserva solicitada
      </span>
      <h3>QUADRA NA AGENDA, {customer.name.split(" ")[0]}!</h3>
      <p>
        {successMessage} A <strong>{selectedCourtData?.name}</strong>{" "}
        foi solicitada para <strong>{selectedModality}</strong>, as{" "}
        <strong>{selectedHorario?.time}</strong>.
      </p>
      <div className="booking-confirmation__code">
        <span>Status</span>
        <strong>Pendente</strong>
      </div>
      <Button variant="dark" onClick={onReset}>
        <ChevronLeft aria-hidden="true" size={18} />
        Fazer nova reserva
      </Button>
    </div>
  );
}
