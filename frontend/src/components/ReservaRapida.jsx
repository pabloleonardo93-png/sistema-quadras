import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  ChevronLeft,
  Clock3,
  MapPin,
  PartyPopper,
  UserRound,
} from "lucide-react";
import { listarHorariosDisponiveis } from "../services/horarioService";
import { criarReservaPublica } from "../services/reservaService";
import { Button } from "./Button";
import { HorariosDisponiveis } from "./HorariosDisponiveis";
import { SectionHeading } from "./SectionHeading";

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const emptyCustomer = { name: "", phone: "", email: "" };

export function ReservaRapida({
  courts = [],
  modalities = [],
  selectedModality,
  selectedCourt,
  onModalityChange,
  onCourtChange,
}) {
  const [date, setDate] = useState(getTomorrow);
  const [selectedTime, setSelectedTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCourtData = useMemo(
    () => courts.find((court) => court.id === selectedCourt),
    [courts, selectedCourt],
  );

  const selectedModalityData = useMemo(
    () => modalities.find((modality) => modality.name === selectedModality),
    [modalities, selectedModality],
  );

  const selectedHorario = useMemo(
    () => availableTimes.find((time) => time.id === selectedTime),
    [availableTimes, selectedTime],
  );

  useEffect(() => {
    let active = true;

    async function carregarHorarios() {
      if (!selectedCourtData?.apiId || !date) {
        setAvailableTimes([]);
        setSelectedTime("");
        return;
      }

      setTimesLoading(true);
      setTimesError("");

      try {
        const horarios = await listarHorariosDisponiveis({
          quadraId: selectedCourtData.apiId,
          modalidadeId: selectedModalityData?.apiId,
          data: date,
        });

        if (!active) return;

        const normalizados = horarios.map((horario) => ({
          id: String(horario.id),
          apiId: horario.id,
          time: String(horario.horaInicio || "").slice(0, 5),
          available: horario.status === "disponivel",
        }));

        setAvailableTimes(normalizados);
        setSelectedTime((current) =>
          normalizados.some((horario) => horario.id === current)
            ? current
            : normalizados[0]?.id || "",
        );
      } catch {
        if (!active) return;
        setAvailableTimes([]);
        setSelectedTime("");
        setTimesError("Nao foi possivel carregar os horarios disponiveis.");
      } finally {
        if (active) setTimesLoading(false);
      }
    }

    carregarHorarios();

    return () => {
      active = false;
    };
  }, [date, selectedCourtData?.apiId, selectedModalityData?.apiId]);

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !selectedModality ||
      !selectedCourt ||
      !date ||
      !selectedTime ||
      !selectedCourtData?.apiId ||
      !selectedModalityData?.apiId ||
      !selectedHorario?.apiId ||
      !customer.name ||
      !customer.phone ||
      !customer.email
    ) {
      setError("Preencha todos os campos para confirmar sua reserva.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await criarReservaPublica({
        nome: customer.name,
        telefone: customer.phone,
        email: customer.email,
        quadraId: selectedCourtData.apiId,
        modalidadeId: selectedModalityData.apiId,
        horarioId: selectedHorario.apiId,
      });
      setSuccessMessage("Reserva realizada com sucesso! Aguarde a confirmacao da arena.");
      setConfirmed(true);
    } catch (requestError) {
      if (requestError.status === 409) {
        setError("Esse horario acabou de ser reservado. Escolha outro horario.");
      } else {
        setError(requestError.message || "Erro ao conectar com a API. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setConfirmed(false);
    setCustomer(emptyCustomer);
    setSuccessMessage("");
  };

  return (
    <section className="booking section" id="reserva">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Reserva rápida"
          title="SEU HORÁRIO EM POUCOS TOQUES."
          description="Escolha a partida, selecione um horario disponivel e envie sua solicitacao para a arena."
          inverse
        />

        <div className="booking__layout">
          <aside className="booking-summary">
            <div className="booking-summary__label">Seu jogo</div>
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
                Arena Onda
                <small>Jardim Atlântico</small>
              </span>
            </div>
            <div className="booking-summary__price">
              <span>Valor estimado</span>
              <strong>
                R$ {Number(selectedCourtData?.valorHora || 0).toFixed(2).replace(".", ",")}
              </strong>
            </div>
            <p>Pagamento realizado presencialmente no dia da partida.</p>
          </aside>

          <div className="booking-panel">
            {confirmed ? (
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
                <Button variant="dark" onClick={resetBooking}>
                  <ChevronLeft aria-hidden="true" size={18} />
                  Fazer nova reserva
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-section">
                  <div className="form-section__title">
                    <span>01</span>
                    <div>
                      <strong>Escolha a partida</strong>
                      <small>Modalidade, quadra e data</small>
                    </div>
                  </div>

                  <div className="form-grid form-grid--three">
                    <label>
                      Modalidade
                      <select
                        value={selectedModality}
                        onChange={(event) =>
                          onModalityChange(event.target.value)
                        }
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
                        onChange={(event) => onCourtChange(event.target.value)}
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
                        type="date"
                        value={date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(event) => setDate(event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title">
                    <span>02</span>
                    <div>
                      <strong>Selecione o horário</strong>
                      <small>Disponibilidade real da API</small>
                    </div>
                  </div>
                  <HorariosDisponiveis
                    error={timesError}
                    isLoading={timesLoading}
                    selectedTime={selectedTime}
                    onSelect={setSelectedTime}
                    times={availableTimes}
                  />
                </div>

                <div className="form-section">
                  <div className="form-section__title">
                    <span>03</span>
                    <div>
                      <strong>Seus dados</strong>
                      <small>Para identificar a reserva</small>
                    </div>
                  </div>
                  <div className="form-grid">
                    <label>
                      Nome completo
                      <input
                        name="name"
                        type="text"
                        placeholder="Como podemos te chamar?"
                        value={customer.name}
                        onChange={handleCustomerChange}
                      />
                    </label>
                    <label>
                      Telefone / WhatsApp
                      <input
                        name="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={customer.phone}
                        onChange={handleCustomerChange}
                      />
                    </label>
                    <label className="form-grid__full">
                      E-mail
                      <input
                        name="email"
                        type="email"
                        placeholder="voce@email.com"
                        value={customer.email}
                        onChange={handleCustomerChange}
                      />
                    </label>
                  </div>
                </div>

                {error && <p className="form-error">{error}</p>}

                <div className="form-submit">
                  <span>
                    <UserRound aria-hidden="true" size={18} />
                    Seus dados serao enviados para confirmar a reserva.
                  </span>
                  <Button type="submit" showArrow disabled={isSubmitting}>
                    {isSubmitting ? "Enviando..." : "Confirmar reserva"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
