import { courts } from "../data/mockData";
import { CardQuadra } from "./CardQuadra";
import { SectionHeading } from "./SectionHeading";

export function QuadrasSection({ onSelect }) {
  return (
    <section className="section courts" id="quadras">
      <div className="page-shell">
        <div className="courts__heading-row">
          <SectionHeading
            eyebrow="Nossa estrutura"
            title="ESCOLHA SUA QUADRA."
            description="Espaços cuidados todos os dias para entregar segurança, conforto e jogo de qualidade."
          />
          <div className="courts__legend" aria-label="Legenda de disponibilidade">
            <span>
              <i className="dot dot--available" /> Disponível
            </span>
            <span>
              <i className="dot dot--busy" /> Em uso
            </span>
            <span>
              <i className="dot dot--maintenance" /> Manutenção
            </span>
          </div>
        </div>

        <div className="courts__grid">
          {courts.map((court) => (
            <CardQuadra key={court.id} court={court} onReserve={onSelect} />
          ))}
        </div>
      </div>
    </section>
  );
}
