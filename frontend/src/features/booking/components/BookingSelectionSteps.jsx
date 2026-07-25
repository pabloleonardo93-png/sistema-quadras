import { Button } from "../../../components/Button";
import { HorariosDisponiveis } from "../../../components/HorariosDisponiveis";

export function BookingSelectionSteps({
  availableTimes,
  courts,
  date,
  dateInputRef,
  isPaymentStepOpen,
  modalities,
  onContinueToCustomerData,
  onCourtChange,
  onDateChange,
  onModalityChange,
  onOpenDatePicker,
  onTimeSelect,
  selectedCourt,
  selectedHorario,
  selectedModality,
  selectedTime,
  showCustomerDataStep,
  timesError,
  timesLoading,
}) {
  return (
    <>
      <div className="form-section">
        <div className="form-section__title">
          <span>01</span>
          <div>
            <strong>Defina o seu jogo</strong>
            <small>Modalidade, quadra e data</small>
          </div>
        </div>

        <div className="form-grid form-grid--three">
          <label>
            Modalidade
            <select
              value={selectedModality}
              onChange={onModalityChange}
            >
              <option value="">Selecione</option>
              {modalities.map((modality) => (
                <option key={modality.id} value={modality.name}>
                  {modality.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quadra
            <select
              value={selectedCourt}
              onChange={onCourtChange}
            >
              <option value="">Selecione</option>
              {courts
                .filter((court) => court.status !== "maintenance")
                .map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Data
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onClick={onOpenDatePicker}
              onFocus={onOpenDatePicker}
              onChange={(event) => onDateChange(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section__title">
          <span>02</span>
          <div>
            <strong>Escolha o horário</strong>
            <small>Atualizado em tempo real</small>
          </div>
        </div>
        <HorariosDisponiveis
          error={timesError}
          isLoading={timesLoading}
          selectedTime={selectedTime}
          onSelect={onTimeSelect}
          times={availableTimes}
        />
        {selectedHorario?.apiId && !showCustomerDataStep && !isPaymentStepOpen && (
          <div className="time-picker__continue">
            <Button
              type="button"
              showArrow
              onClick={onContinueToCustomerData}
            >
              Continuar para preencher dados
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
