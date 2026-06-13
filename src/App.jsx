import { useState } from "react";
import { ContatoSection } from "./components/ContatoSection";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { MobileBookingBar } from "./components/MobileBookingBar";
import { ModalidadesSection } from "./components/ModalidadesSection";
import { QuadrasSection } from "./components/QuadrasSection";
import { ReservaRapida } from "./components/ReservaRapida";
import { SobreArena } from "./components/SobreArena";

function App() {
  const [selectedModality, setSelectedModality] = useState("Beach Tennis");
  const [selectedCourt, setSelectedCourt] = useState("onda-1");

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
        <ModalidadesSection onSelect={handleModalitySelect} />
        <QuadrasSection onSelect={handleCourtSelect} />
        <ReservaRapida
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

export default App;
