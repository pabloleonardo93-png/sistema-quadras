import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  ChevronLeft,
  Clock3,
  CreditCard,
  MapPin,
  PartyPopper,
  QrCode,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { arenaInfo } from "../constants/arenaInfo";
import { brand } from "../constants/brand";
import { listarHorariosDisponiveis } from "../services/horarioService";
import { criarReservaPublicaComPagamento } from "../services/reservaService";
import { Button } from "./Button";
import { HorariosDisponiveis } from "./HorariosDisponiveis";
import { SectionHeading } from "./SectionHeading";

const getTomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
};

const isDateParam = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

const emptyCustomer = { name: "", phone: "", email: "" };
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 11;

const getPhoneDigits = (value) => value.replace(/\D/g, "");

const formatPhone = (value) => {
  const digits = getPhoneDigits(value).slice(0, PHONE_MAX_DIGITS);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function ReservaRapida({
  courts = [],
  modalities = [],
  selectedModality,
  selectedCourt,
  initialDate,
  initialTimeId,
  isCustomerDataRoute = false,
  onModalityChange,
  onCourtChange,
}) {
  const navigate = useNavigate();
  const [date, setDate] = useState(() =>
    isDateParam(initialDate) ? initialDate : getTomorrow(),
  );
  const [selectedTime, setSelectedTime] = useState(() =>
    initialTimeId ? String(initialTimeId) : "",
  );
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarDados, setMostrarDados] = useState(isCustomerDataRoute);
  const [isPaymentStepOpen, setIsPaymentStepOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");

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

  const valorFormatado = Number(selectedCourtData?.valorHora || 0)
    .toFixed(2)
    .replace(".", ",");

  const dataFormatada = date
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`))
    : "--";
  const showCustomerDataStep = isCustomerDataRoute || mostrarDados;
  const customerStepNumber = isCustomerDataRoute
    ? isPaymentStepOpen
      ? "02"
      : "01"
    : "03";
  const bookingHeadingDescription = isCustomerDataRoute
    ? "Revise a escolha, preencha seus dados e finalize no checkout seguro."
    : "Escolha a quadra, veja os horários disponíveis e avance para o pagamento.";

  useEffect(() => {
    let active = true;

    async function carregarHorarios() {
      if (!selectedCourtData?.apiId || !date) {
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
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

        const horariosDaQuadra = horarios.filter((horario) => {
          const horaInicio = String(horario.horaInicio || "").slice(0, 5);
          return (
            Number(horario.quadraId) === Number(selectedCourtData.apiId) &&
            horaInicio >= "08:00" &&
            horaInicio < "23:00"
          );
        });
        const horariosUnicos = Array.from(
          new Map(
            horariosDaQuadra.map((horario) => [
              String(horario.horaInicio || "").slice(0, 5),
              horario,
            ]),
          ).values(),
        );

        const normalizados = horariosUnicos.map((horario) => ({
          id: String(horario.id),
          apiId: horario.id,
          time: String(horario.horaInicio || "").slice(0, 5),
          available: horario.status === "disponivel",
        }));

        setAvailableTimes(normalizados);
        setSelectedTime((current) => {
          const requestedTime = initialTimeId ? String(initialTimeId) : "";

          if (requestedTime && normalizados.some((horario) => horario.id === requestedTime)) {
            return requestedTime;
          }

          return normalizados.some((horario) => horario.id === current)
            ? current
            : "";
        });
      } catch {
        if (!active) return;
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesError("Não foi possível carregar os horários disponíveis.");
      } finally {
        if (active) setTimesLoading(false);
      }
    }

    carregarHorarios();

    return () => {
      active = false;
    };
  }, [date, initialTimeId, selectedCourtData?.apiId, selectedModalityData?.apiId]);

  const resetPaymentState = () => {
    setIsPaymentStepOpen(false);
  };

  const resetReservationProgress = () => {
    resetPaymentState();
    setMostrarDados(false);
    setSelectedTime("");
  };

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    resetPaymentState();
    setCustomer((current) => ({
      ...current,
      [name]: name === "phone" ? formatPhone(value) : value,
    }));
  };

  const handleSelectionChange = (callback) => (value) => {
    resetReservationProgress();
    callback(value);
  };

  const handleContinueToCustomerData = () => {
    if (!selectedHorario?.apiId) {
      setError("Selecione um horário disponível para continuar.");
      return;
    }

    const params = new URLSearchParams({
      quadra: selectedCourt,
      modalidade: selectedModality,
      data: date,
      horario: String(selectedHorario.apiId),
    });

    setError("");
    navigate(`/reserva/dados?${params.toString()}`);
  };

  const validateBooking = () => {
    const phoneDigits = getPhoneDigits(customer.phone);

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
      return "Preencha todos os campos para continuar para o pagamento.";
    }

    if (phoneDigits.length < PHONE_MIN_DIGITS) {
      return "Informe um telefone com DDD e número completo.";
    }

    return "";
  };

  const handleContinueToPayment = (event) => {
    event.preventDefault();
    const validationError = validateBooking();

    if (validationError) {
      setIsPaymentStepOpen(false);
      setError(validationError);
      return;
    }

    setError("");
    setIsPaymentStepOpen(true);
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateBooking();

    if (validationError) {
      setIsPaymentStepOpen(false);
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        nome: customer.name,
        telefone: customer.phone,
        email: customer.email,
        quadraId: selectedCourtData.apiId,
        modalidadeId: selectedModalityData.apiId,
        horarioId: selectedHorario.apiId,
      };

      const pagamentoResponse = await criarReservaPublicaComPagamento(payload);
      if (pagamentoResponse.checkoutUrl) {
        window.location.assign(pagamentoResponse.checkoutUrl);
        return;
      }
      setSuccessMessage("Reserva criada, mas o checkout de pagamento não retornou uma URL.");
      setConfirmed(true);
    } catch (requestError) {
      const errorMessage = requestError.message || "";
      if (requestError.status === 409 && /hor[aá]rio|reserva/i.test(errorMessage)) {
        setError("Esse horário acabou de ser reservado. Escolha outro horário.");
      } else if (requestError.status === 409) {
        setError(errorMessage || "Não foi possível continuar com esses dados.");
      } else if (requestError.status === 503) {
        setError("Pagamento online ainda não configurado. Configure o token do Mercado Pago no backend.");
      } else {
        setError(errorMessage || "Erro ao conectar com a API. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setConfirmed(false);
    setCustomer(emptyCustomer);
    setSuccessMessage("");
    resetPaymentState();
    setMostrarDados(false);
  };

  return (
    <section className="booking section" id="reserva">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Reserva rápida"
          title="SEU HORÁRIO EM POUCOS TOQUES."
          description={bookingHeadingDescription}
          inverse
        />

        <div className="booking__layout">
          <aside className="booking-summary">
            <div className="booking-summary__label">Seu jogo</div>
            <div className="booking-summary__court">
              <span>{selectedCourtData?.name || "Escolha a quadra"}</span>
              <small>{selectedModality || "Escolha a modalidade"}</small>
            </div>
            {selectedCourtData?.image && (
              <div className="booking-summary__photo">
                <img
                  src={selectedCourtData.image}
                  alt={`Foto da ${selectedCourtData.name}`}
                />
              </div>
            )}
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
            <div className="booking-summary__price">
              <span>Valor da reserva</span>
              <strong>R$ {valorFormatado}</strong>
            </div>
            <div className="booking-summary__location">
              <MapPin aria-hidden="true" size={18} />
              <span>
                {brand.name}
                <small>{arenaInfo.neighborhood}</small>
              </span>
            </div>
            <p>Pagamento online no checkout seguro, com Pix, cartão e boleto quando disponíveis.</p>
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
              <form
                onSubmit={
                  isPaymentStepOpen
                    ? handlePaymentSubmit
                    : showCustomerDataStep
                      ? handleContinueToPayment
                      : (event) => event.preventDefault()
                }
                noValidate
              >
                {!isCustomerDataRoute && (
                  <>
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
                          handleSelectionChange(onModalityChange)(
                            event.target.value,
                          )
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
                        onChange={(event) =>
                          handleSelectionChange(onCourtChange)(event.target.value)
                        }
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
                        onChange={(event) => {
                          resetReservationProgress();
                          setDate(event.target.value);
                        }}
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
                    onSelect={(timeId) => {
                      resetReservationProgress();
                      setSelectedTime(timeId);
                    }}
                    times={availableTimes}
                  />
                  {selectedHorario?.apiId && !showCustomerDataStep && !isPaymentStepOpen && (
                    <div className="time-picker__continue">
                      <Button
                        type="button"
                        showArrow
                        onClick={handleContinueToCustomerData}
                      >
                        Continuar para preencher dados
                      </Button>
                    </div>
                  )}
                </div>
                  </>
                )}

                {showCustomerDataStep && (
                  <div className="form-section" id="dados-reserva">
                  <div className="form-section__title">
                    <span>{customerStepNumber}</span>
                    <div>
                      <strong>{isPaymentStepOpen ? "Pagamento" : "Seus dados"}</strong>
                      <small>
                        {isPaymentStepOpen
                          ? "Checkout seguro do Mercado Pago"
                          : "Para identificar a reserva"}
                      </small>
                    </div>
                  </div>
                  {isPaymentStepOpen ? (
                    <div className="payment-review" aria-live="polite">
                      <div className="payment-review__header">
                        <span>
                          {paymentMethod === "pix" ? (
                            <QrCode aria-hidden="true" size={20} />
                          ) : (
                            <ShieldCheck aria-hidden="true" size={20} />
                          )}
                        </span>
                        <div>
                          <strong>Forma de pagamento</strong>
                          <small>
                            Você escolhe a forma disponível dentro do checkout.
                          </small>
                        </div>
                      </div>
                      <div className="payment-methods" role="group" aria-label="Forma de pagamento">
                        <button
                          className={`payment-methods__option${
                            paymentMethod === "pix" ? " is-selected" : ""
                          }`}
                          type="button"
                          onClick={() => setPaymentMethod("pix")}
                          aria-pressed={paymentMethod === "pix"}
                        >
                          <QrCode aria-hidden="true" size={18} />
                          <span>
                            <strong>Pix no checkout</strong>
                            <small>Disponível se liberado no Mercado Pago</small>
                          </span>
                        </button>
                        <button
                          className={`payment-methods__option${
                            paymentMethod === "card" ? " is-selected" : ""
                          }`}
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          aria-pressed={paymentMethod === "card"}
                        >
                          <CreditCard aria-hidden="true" size={18} />
                          <span>
                            <strong>Cartão no checkout</strong>
                            <small>Crédito ou débito quando disponível</small>
                          </span>
                        </button>
                      </div>
                      <div className="payment-review__grid">
                        <span>
                          <small>Quadra</small>
                          <strong>{selectedCourtData?.name}</strong>
                        </span>
                        <span>
                          <small>Modalidade</small>
                          <strong>{selectedModality}</strong>
                        </span>
                        <span>
                          <small>Data</small>
                          <strong>{dataFormatada}</strong>
                        </span>
                        <span>
                          <small>Horário</small>
                          <strong>{selectedHorario?.time}</strong>
                        </span>
                        <span>
                          <small>Cliente</small>
                          <strong>{customer.name}</strong>
                        </span>
                        <span>
                          <small>Valor da reserva</small>
                          <strong>R$ {valorFormatado}</strong>
                        </span>
                      </div>
                    </div>
                  ) : (
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
                          inputMode="numeric"
                          maxLength={15}
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
                  )}
                  </div>
                )}

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                {showCustomerDataStep && (
                  <div className="form-submit">
                  {isPaymentStepOpen ? (
                    <button
                      className="form-submit__back"
                      type="button"
                      onClick={() => setIsPaymentStepOpen(false)}
                    >
                      <ChevronLeft aria-hidden="true" size={18} />
                      Voltar aos dados
                    </button>
                  ) : (
                    <span>
                      <UserRound aria-hidden="true" size={18} />
                      Seus dados serão enviados para confirmar a reserva.
                    </span>
                  )}
                  <Button type="submit" showArrow disabled={isSubmitting}>
                    {isSubmitting
                      ? "Abrindo checkout..."
                      : isPaymentStepOpen
                        ? "Abrir checkout seguro"
                        : "Continuar para pagamento"}
                  </Button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
