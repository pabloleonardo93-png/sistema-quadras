import { availableTimes } from "../constants/mockData";

export function HorariosDisponiveis({ selectedTime, onSelect }) {
  return (
    <div className="time-picker">
      <div className="time-picker__heading">
        <span>Horários disponíveis</span>
        <small>1 hora por reserva</small>
      </div>
      <div className="time-grid">
        {availableTimes.map(({ time, available }) => (
          <button
            key={time}
            className={selectedTime === time ? "is-selected" : ""}
            type="button"
            disabled={!available}
            onClick={() => onSelect(time)}
            aria-pressed={selectedTime === time}
          >
            {time}
          </button>
        ))}
      </div>
      <p className="time-picker__hint">
        Horários riscados já estão reservados.
      </p>
    </div>
  );
}
