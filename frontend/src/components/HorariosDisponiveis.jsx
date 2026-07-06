export function HorariosDisponiveis({
  error = "",
  isLoading = false,
  selectedTime,
  times = [],
  onSelect,
}) {
  const hasReservedTimes = times.some(({ available = true }) => !available);

  return (
    <div className="time-picker">
      <div className="time-picker__heading">
        <span>Horários disponíveis</span>
        <small>1 hora por reserva</small>
      </div>
      <div className="time-grid" role="group" aria-label="Horários disponíveis">
        {isLoading && (
          <p className="section-state" role="status" aria-live="polite">
            Carregando horários...
          </p>
        )}
        {!isLoading && error && (
          <p className="section-state section-state--error" role="alert">
            {error}
          </p>
        )}
        {!isLoading && !error && times.length === 0 && (
          <p className="section-state">Nenhum horário disponível para esta escolha.</p>
        )}
        {!isLoading && !error && times.map(({ id, time, available = true }) => (
          <button
            key={id}
            className={selectedTime === id ? "is-selected" : ""}
            type="button"
            disabled={!available}
            onClick={() => onSelect(id)}
            aria-pressed={selectedTime === id}
          >
            {time}
          </button>
        ))}
      </div>
      {!isLoading && !error && hasReservedTimes && (
        <p className="time-picker__hint">
          Horários riscados já estão reservados.
        </p>
      )}
    </div>
  );
}
