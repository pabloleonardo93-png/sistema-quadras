import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Footer } from "../components/Footer";
import { ReservaRapida } from "../components/ReservaRapida";
import { brand } from "../constants/brand";
import { getCourtImage } from "../constants/courtImages";
import {
  registrarVisualizacaoDadosReserva,
  registrarVisualizacaoMarcacaoReserva,
} from "../services/analyticsService";
import { listarModalidades } from "../services/modalidadeService";
import { listarQuadras } from "../services/quadraService";

function statusDaQuadra(status) {
  const statuses = {
    ativa: { status: "available", statusLabel: "Disponível hoje" },
    manutencao: { status: "maintenance", statusLabel: "Manutenção" },
    inativa: { status: "maintenance", statusLabel: "Indisponível" },
  };
  return statuses[status] || statuses.ativa;
}

function normalizarModalidade(modalidade) {
  return {
    id: String(modalidade.id),
    apiId: modalidade.id,
    name: modalidade.nome,
  };
}

function normalizarQuadra(quadra, index) {
  const status = statusDaQuadra(quadra.status);
  return {
    id: String(quadra.id),
    apiId: quadra.id,
    name: quadra.nome,
    image: getCourtImage(quadra, index),
    valorHora: Number(quadra.valorHora || 0),
    ...status,
  };
}

function selecionarQuadraInicial(courts, requestedCourtId) {
  const availableCourts = courts.filter((court) => court.status !== "maintenance");
  const requestedCourt = availableCourts.find((court) => court.id === requestedCourtId);

  return requestedCourt?.id || availableCourts[0]?.id || courts[0]?.id || "";
}

function ReservationPageState({ children, isError = false }) {
  return (
    <section className="booking section reservation-page__state-section">
      <div className="page-shell">
        <div
          className={`reservation-page__state ${isError ? "reservation-page__state--error" : ""}`}
          role={isError ? "alert" : "status"}
          aria-live={isError ? "assertive" : "polite"}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export default function ReservaPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const requestedCourtId = searchParams.get("quadra");
  const requestedModality = searchParams.get("modalidade");
  const requestedDate = searchParams.get("data");
  const requestedTimeId = searchParams.get("horario");
  const isCustomerDataRoute = location.pathname === "/reserva/dados";
  const [selectedModality, setSelectedModality] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courts, setCourts] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const caminho = `${location.pathname}${location.search}`;
    if (isCustomerDataRoute) {
      registrarVisualizacaoDadosReserva(caminho);
      return;
    }
    registrarVisualizacaoMarcacaoReserva(caminho);
  }, [isCustomerDataRoute, location.pathname, location.search]);

  useEffect(() => {
    let active = true;

    async function carregarDadosDaReserva() {
      setIsLoading(true);
      setError("");

      try {
        const [quadrasApi, modalidadesApi] = await Promise.all([
          listarQuadras(),
          listarModalidades(),
        ]);

        if (!active) return;

        const quadrasNormalizadas = quadrasApi.map(normalizarQuadra);
        const modalidadesNormalizadas = modalidadesApi.map(normalizarModalidade);

        setCourts(quadrasNormalizadas);
        setModalities(modalidadesNormalizadas);
        setSelectedCourt(selecionarQuadraInicial(quadrasNormalizadas, requestedCourtId));
        setSelectedModality(
          modalidadesNormalizadas.find((modalidade) => modalidade.name === requestedModality)?.name ||
            modalidadesNormalizadas[0]?.name ||
            "",
        );
      } catch {
        if (!active) return;
        setError("Não foi possível carregar os dados para reserva.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    carregarDadosDaReserva();

    return () => {
      active = false;
    };
  }, [requestedCourtId, requestedModality]);

  return (
    <>
      <main className="reservation-page">
        <header className="page-shell reservation-page__header">
          <a className="brand brand--reservation brand--image" href="/#inicio" aria-label={`${brand.name}, início`}>
            <img
              className="brand__logo-image"
              src="/images/logo/logo-pe-na-areia-header-white.png"
              alt={brand.name}
            />
          </a>
          <a className="reservation-page__back" href="/#quadras">
            <ArrowLeft aria-hidden="true" size={18} />
            Voltar ao site
          </a>
        </header>

        {isLoading && (
          <ReservationPageState>
            <p>Carregando reserva...</p>
          </ReservationPageState>
        )}

        {!isLoading && error && (
          <ReservationPageState isError>
            <p>{error}</p>
          </ReservationPageState>
        )}

        {!isLoading && !error && (
          <ReservaRapida
            key={`${location.pathname}-${searchParams.toString()}`}
            courts={courts}
            modalities={modalities}
            selectedModality={selectedModality}
            selectedCourt={selectedCourt}
            initialDate={requestedDate}
            initialTimeId={requestedTimeId}
            isCustomerDataRoute={isCustomerDataRoute}
            onModalityChange={setSelectedModality}
            onCourtChange={setSelectedCourt}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
