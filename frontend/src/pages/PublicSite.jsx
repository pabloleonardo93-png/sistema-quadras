import { useEffect, useState } from "react";
import { ComunicadosSection } from "../components/ComunicadosSection";
import { ComoReservarSection } from "../components/ComoReservarSection";
import { ContatoSection } from "../components/ContatoSection";
import { EventosSection } from "../components/EventosSection";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { HeroSection } from "../components/HeroSection";
import { MobileBookingBar } from "../components/MobileBookingBar";
import { MovimentoSection } from "../components/MovimentoSection";
import { PageIntro } from "../components/PageIntro";
import { QuadrasSection } from "../components/QuadrasSection";
import { ReservasSection } from "../components/ReservasSection";
import { ScrollEffectSequence } from "../components/ScrollEffectSequence";
import { ScrollFadeUp } from "../components/ScrollFadeUp";
import { SobreArena } from "../components/SobreArena";
import { getCourtImage } from "../constants/courtImages";
import { listarComunicadosPublicos } from "../services/comunicadoService";
import { listarQuadras } from "../services/quadraService";

function statusDaQuadra(status) {
  const statuses = {
    ativa: { status: "available", statusLabel: "Disponivel hoje" },
    manutencao: { status: "maintenance", statusLabel: "Manutencao" },
    inativa: { status: "maintenance", statusLabel: "Indisponivel" },
  };
  return statuses[status] || statuses.ativa;
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
    detail: `R$ ${Number(quadra.valorHora || 0).toFixed(2).replace(".", ",")} por horario`,
    valorHora: Number(quadra.valorHora || 0),
    ...status,
  };
}

export function PublicSite() {
  const [courts, setCourts] = useState([]);
  const [comunicados, setComunicados] = useState([]);
  const [loading, setLoading] = useState({
    courts: true,
    comunicados: true,
  });
  const [errors, setErrors] = useState({
    courts: "",
    comunicados: "",
  });

  useEffect(() => {
    let active = true;

    async function carregarDadosPublicos() {
      try {
        const [quadrasApi, comunicadosApi] = await Promise.all([
          listarQuadras(),
          listarComunicadosPublicos(),
        ]);

        if (!active) return;

        const quadrasNormalizadas = quadrasApi.map(normalizarQuadra);

        setCourts(quadrasNormalizadas);
        setComunicados(comunicadosApi);
        setErrors({ courts: "", comunicados: "" });
      } catch {
        if (!active) return;
        setErrors({
          courts: "Nao foi possivel carregar as quadras.",
          comunicados: "Nao foi possivel carregar os comunicados.",
        });
      } finally {
        if (active) {
          setLoading({ courts: false, comunicados: false });
        }
      }
    }

    carregarDadosPublicos();

    return () => {
      active = false;
    };
  }, []);

  const scrollToSection = (sectionId, hash) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    window.history.pushState(null, "", hash);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToCourtStory = () => scrollToSection("quadras", "#quadras");
  const scrollToBookingCards = () =>
    scrollToSection("quadras-disponiveis", "#quadras-disponiveis");

  const fadeUpWatchKey = `${loading.courts}-${courts.length}`;

  return (
    <>
      <PageIntro />
      <Header />
      <ScrollFadeUp watchKey={fadeUpWatchKey} />
      <main>
        <HeroSection
          onExploreCourts={scrollToCourtStory}
          onReserve={scrollToBookingCards}
        />
        <MovimentoSection courts={courts} onReserve={scrollToBookingCards} />
        <ScrollEffectSequence>
          <ComunicadosSection
            comunicados={comunicados}
            error={errors.comunicados}
            isLoading={loading.comunicados}
          />
          <QuadrasSection
            courts={courts}
            error={errors.courts}
            isLoading={loading.courts}
          />
          <ReservasSection />
          <ComoReservarSection onReserve={scrollToBookingCards} />
          <SobreArena />
          <EventosSection onReserve={scrollToBookingCards} />
          <ContatoSection />
        </ScrollEffectSequence>
      </main>
      <Footer />
      <MobileBookingBar onReserve={scrollToBookingCards} />
    </>
  );
}
