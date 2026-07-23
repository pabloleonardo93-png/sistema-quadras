import { CardQuadra } from "./CardQuadra";
import { SectionHeading } from "./SectionHeading";

export function QuadrasSection({ courts = [], error = "", isLoading = false }) {
  return (
    <section className="section courts" id="quadras-disponiveis" data-scroll-fade-section>
      <div className="page-shell">
        <div className="courts__heading-row" data-scroll-fade>
          <SectionHeading
            eyebrow="Nossa estrutura"
            title="ESCOLHA SUA QUADRA."
            description="Espaços cuidados de terça a domingo para entregar segurança, conforto e jogo de qualidade."
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
            <p
              className="section-state"
              role="status"
              aria-live="polite"
              data-scroll-fade
            >
              Carregando quadras...
            </p>
          )}
          {!isLoading && error && (
            <p
              className="section-state section-state--error"
              role="alert"
              data-scroll-fade
            >
              {error}
            </p>
          )}
          {!isLoading && !error && courts.length === 0 && (
            <p className="section-state" data-scroll-fade>
              Nenhuma quadra encontrada.
            </p>
          )}
          {!isLoading &&
            !error &&
            courts.map((court) => (
              <CardQuadra key={court.id} court={court} reveal />
            ))}
        </div>
      </div>
    </section>
  );
}
