import { CalendarDays } from "lucide-react";

export function MobileBookingBar({ onReserve }) {
  return (
    <button className="mobile-booking-bar" type="button" onClick={onReserve}>
      <span>
        <small>Agenda aberta hoje</small>
        Reserve sua quadra
      </span>
      <CalendarDays aria-hidden="true" size={21} />
    </button>
  );
}
