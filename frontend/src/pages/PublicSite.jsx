import { useEffect, useState } from "react";
import { CircleDot, Footprints, Trophy } from "lucide-react";
import { ComunicadosSection } from "../components/ComunicadosSection";
import { ComoReservarSection } from "../components/ComoReservarSection";
import { ContatoSection } from "../components/ContatoSection";
import { DestaquesSection } from "../components/DestaquesSection";
import { EventosSection } from "../components/EventosSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { MobileBookingBar } from "../components/MobileBookingBar";
import { ModalidadesSection } from "../components/ModalidadesSection";
import { QuadrasSection } from "../components/QuadrasSection";
import { ReservasSection } from "../components/ReservasSection";
import { SobreArena } from "../components/SobreArena";
import { getCourtImage } from "../constants/courtImages";
import { listarComunicadosPublicos } from "../services/comunicadoService";
import { listarModalidades } from "../services/modalidadeService";
import { listarQuadras } from "../services/quadraService";

const modalityVisuals = [
  { icon: CircleDot, accent: "coral", eyebrow: "Rapido e vibrante" },
  { icon: Footprints, accent: "blue", eyebrow: "Tecnica no alto" },
  { icon: Trophy, accent: "yellow", eyebrow: "Jogo em equipe" },
];

function statusDaQuadra(status) {
  const statuses = {
    ativa: { status: "available", statusLabel: "Disponível hoje" },
    manutencao: { status: "maintenance", statusLabel: "Manutenção" },
    inativa: { status: "maintenance", statusLabel: "Indisponível" },
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
      "Modalidade cadastrada no complexo e pronta para reservas online.",
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
    image: getCourtImage(quadra, index),
    detail: `R$ ${Number(quadra.valorHora || 0).toFixed(2).replace(".", ",")} por horário`,
    valorHora: Number(quadra.valorHora || 0),
    ...status,
  };
}

export function PublicSite() {
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
        setErrors({ courts: "", modalities: "", comunicados: "" });
      } catch {
        if (!active) return;
        setErrors({
          courts: "Não foi possível carregar as quadras.",
          modalities: "Não foi possível carregar as modalidades.",
          comunicados: "Não foi possível carregar os comunicados.",
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

  const scrollToCourts = () => {
    document
      .getElementById("quadras")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleModalitySelect = () => {
    scrollToCourts();
  };

  return (
    <>
      <Header />
      <main>
        <HeroSection onReserve={scrollToCourts} />
        <DestaquesSection
          courtsCount={courts.length}
          modalitiesCount={modalities.length}
          isLoading={loading.courts || loading.modalities}
        />
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
        />
        <ReservasSection courts={courts} />
        <ComoReservarSection onReserve={scrollToCourts} />
        <SobreArena />
        <EventosSection onReserve={scrollToCourts} />
        <ContatoSection />
      </main>
      <Footer />
      <MobileBookingBar onReserve={scrollToCourts} />
    </>
  );
}
