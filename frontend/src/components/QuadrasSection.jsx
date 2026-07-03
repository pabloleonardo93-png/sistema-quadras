import { CardQuadra } from "./CardQuadra";
import { SectionHeading } from "./SectionHeading";

export function QuadrasSection({ courts = [], error = "", isLoading = false }) {
  return (
    <section className="section courts">
      <div className="page-shell" id="quadras">
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
          {isLoading && (
            <p className="section-state" role="status" aria-live="polite">
              Carregando quadras...
            </p>
          )}
          {!isLoading && error && (
            <p className="section-state section-state--error" role="alert">
              {error}
            </p>
          )}
          {!isLoading && !error && courts.length === 0 && (
            <p className="section-state">Nenhuma quadra encontrada.</p>
          )}
          {!isLoading &&
            !error &&
            courts.map((court) => <CardQuadra key={court.id} court={court} />)}
        </div>
      </div>
    </section>
  );
}
