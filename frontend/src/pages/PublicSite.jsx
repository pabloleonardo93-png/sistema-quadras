import { useEffect, useState } from "react";
import { CircleDot, Footprints, Trophy } from "lucide-react";
import { ComunicadosSection } from "../components/ComunicadosSection";
import { ContatoSection } from "../components/ContatoSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { MobileBookingBar } from "../components/MobileBookingBar";
import { ModalidadesSection } from "../components/ModalidadesSection";
import { QuadrasSection } from "../components/QuadrasSection";
import { ReservaRapida } from "../components/ReservaRapida";
import { SobreArena } from "../components/SobreArena";
import { courtImages } from "../constants/courtImages";
import { listarComunicadosPublicos } from "../services/comunicadoService";
import { listarModalidades } from "../services/modalidadeService";
import { listarQuadras } from "../services/quadraService";

const modalityVisuals = [
  { icon: CircleDot, accent: "coral", eyebrow: "Rapido e vibrante" },
  { icon: Footprints, accent: "blue", eyebrow: "Tecnica no alto" },
  { icon: Trophy, accent: "yellow", eyebrow: "Jogo em equipe" },
];

const courtImageFallbacks = [
  courtImages.onda1,
  courtImages.onda2,
  courtImages.onda3,
];

function statusDaQuadra(status) {
  const statuses = {
    ativa: { status: "available", statusLabel: "Disponivel hoje" },
    manutencao: { status: "maintenance", statusLabel: "Manutencao" },
    inativa: { status: "maintenance", statusLabel: "Indisponivel" },
  };
  return statuses[status] || statuses.ativa;
}

function normalizarModalidade(modalidade, index) {
  const visual = modalityVisuals[index % modalityVisuals.length];
  return {
    id: String(modalidade.id),
    apiId: modalidade.id,
    name: modalidade.nome,
    eyebrow: visual.eyebrow,
    description:
      modalidade.descricao ||
      "Modalidade cadastrada na arena e pronta para reservas online.",
    icon: visual.icon,
    accent: visual.accent,
  };
}

function normalizarQuadra(quadra, index) {
  const status = statusDaQuadra(quadra.status);
  return {
    id: String(quadra.id),
    apiId: quadra.id,
    name: quadra.nome,
    subtitle: quadra.descricao || `Quadra ${index + 1}`,
    modalities: (quadra.modalidades || []).map((modalidade) => modalidade.nome),
    image: quadra.imagemUrl || courtImageFallbacks[index % courtImageFallbacks.length],
    detail: `R$ ${Number(quadra.valorHora || 0).toFixed(2).replace(".", ",")} por horario`,
    valorHora: Number(quadra.valorHora || 0),
    ...status,
  };
}

export function PublicSite() {
  const [selectedModality, setSelectedModality] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [courts, setCourts] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState({
    courts: true,
    modalities: true,
    comunicados: true,
  });
  const [errors, setErrors] = useState({
    courts: "",
    modalities: "",
    comunicados: "",
  });

  useEffect(() => {
    let active = true;

    async function carregarDadosPublicos() {
      try {
        const [quadrasApi, modalidadesApi, comunicadosApi] = await Promise.all([
          listarQuadras(),
          listarModalidades(),
          listarComunicadosPublicos(),
        ]);

        if (!active) return;

        const quadrasNormalizadas = quadrasApi.map(normalizarQuadra);
        const modalidadesNormalizadas = modalidadesApi.map(normalizarModalidade);

        setCourts(quadrasNormalizadas);
        setModalities(modalidadesNormalizadas);
        setComunicados(comunicadosApi);
        setSelectedCourt((current) => current || quadrasNormalizadas[0]?.id || "");
        setSelectedModality((current) => current || modalidadesNormalizadas[0]?.name || "");
        setErrors({ courts: "", modalities: "", comunicados: "" });
      } catch {
        if (!active) return;
        setErrors({
          courts: "Nao foi possivel carregar as quadras.",
          modalities: "Nao foi possivel carregar as modalidades.",
          comunicados: "Nao foi possivel carregar os comunicados.",
        });
      } finally {
        if (active) {
          setLoading({ courts: false, modalities: false, comunicados: false });
        }
      }
    }

    carregarDadosPublicos();

    return () => {
      active = false;
    };
  }, []);

  const scrollToBooking = () => {
    document
      .getElementById("reserva")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleModalitySelect = (modality) => {
    setSelectedModality(modality);
    scrollToBooking();
  };

  const handleCourtSelect = (courtId) => {
    setSelectedCourt(courtId);
    scrollToBooking();
  };

  return (
    <>
      <Header onReserve={scrollToBooking} />
      <main>
        <HeroSection onReserve={scrollToBooking} />
        <ComunicadosSection
          comunicados={comunicados}
          error={errors.comunicados}
          isLoading={loading.comunicados}
        />
        <ModalidadesSection
          error={errors.modalities}
          isLoading={loading.modalities}
          modalities={modalities}
          onSelect={handleModalitySelect}
        />
        <QuadrasSection
          courts={courts}
          error={errors.courts}
          isLoading={loading.courts}
          onSelect={handleCourtSelect}
        />
        <ReservaRapida
          courts={courts}
          modalities={modalities}
          selectedModality={selectedModality}
          selectedCourt={selectedCourt}
          onModalityChange={setSelectedModality}
          onCourtChange={setSelectedCourt}
        />
        <SobreArena />
        <ContatoSection />
      </main>
      <Footer />
      <MobileBookingBar onReserve={scrollToBooking} />
    </>
  );
}
