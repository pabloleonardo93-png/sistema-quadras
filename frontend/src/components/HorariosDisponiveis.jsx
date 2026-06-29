export function HorariosDisponiveis({
  error = "",
  isLoading = false,
  selectedTime,
  times = [],
  onSelect,
}) {
  return (
    <div className="time-picker">
      <div className="time-picker__heading">
        <span>Horários disponíveis</span>
        <small>1 hora por reserva</small>
      </div>
      <div className="time-grid">
        {isLoading && <p className="section-state">Carregando horarios...</p>}
        {!isLoading && error && <p className="section-state section-state--error">{error}</p>}
        {!isLoading && !error && times.length === 0 && (
          <p className="section-state">Nenhum horario disponivel para esta escolha.</p>
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
      <p className="time-picker__hint">
        Horários riscados já estão reservados.
      </p>
    </div>
  );
}
