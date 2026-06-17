import { useMemo, useState } from "react";
import {
  CalendarCheck,
  ChevronLeft,
  Clock3,
  MapPin,
  PartyPopper,
  UserRound,
} from "lucide-react";
import { courts, modalities } from "../constants/mockData";
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
  selectedModality,
  selectedCourt,
  onModalityChange,
  onCourtChange,
}) {
  const [date, setDate] = useState(getTomorrow);
  const [selectedTime, setSelectedTime] = useState("18:00");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  const selectedCourtData = useMemo(
    () => courts.find((court) => court.id === selectedCourt),
    [selectedCourt],
  );

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (
      !selectedModality ||
      !selectedCourt ||
      !date ||
      !selectedTime ||
      !customer.name ||
      !customer.phone ||
      !customer.email
    ) {
      setError("Preencha todos os campos para confirmar sua simulação.");
      return;
    }
    setError("");
    setConfirmed(true);
  };

  const resetBooking = () => {
    setConfirmed(false);
    setCustomer(emptyCustomer);
  };

  return (
    <section className="booking section" id="reserva">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Reserva rápida"
          title="SEU HORÁRIO EM POUCOS TOQUES."
          description="Escolha a partida, selecione um horário e pronto. Nesta demonstração, nenhum pagamento será realizado."
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
                {selectedTime || "--:--"}
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
              <strong>R$ 90<small>,00</small></strong>
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
                  Simulação concluída
                </span>
                <h3>QUADRA NA AGENDA, {customer.name.split(" ")[0]}!</h3>
                <p>
                  Reservamos visualmente a <strong>{selectedCourtData?.name}</strong>{" "}
                  para <strong>{selectedModality}</strong>, às{" "}
                  <strong>{selectedTime}</strong>. A confirmação real será
                  habilitada na próxima etapa do projeto.
                </p>
                <div className="booking-confirmation__code">
                  <span>Código da simulação</span>
                  <strong>ONDA-2048</strong>
                </div>
                <Button variant="dark" onClick={resetBooking}>
                  <ChevronLeft aria-hidden="true" size={18} />
                  Fazer nova simulação
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
                      <small>Disponibilidade simulada</small>
                    </div>
                  </div>
                  <HorariosDisponiveis
                    selectedTime={selectedTime}
                    onSelect={setSelectedTime}
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
                    Seus dados são usados apenas nesta demonstração.
                  </span>
                  <Button type="submit" showArrow>
                    Confirmar simulação
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

