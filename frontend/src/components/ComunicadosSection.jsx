import { Megaphone } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

export function ComunicadosSection({
  comunicados = [],
  error = "",
  isLoading = false,
}) {
  if (!isLoading && !error && comunicados.length === 0) return null;

  return (
    <section className="section announcements" id="comunicados">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Avisos do complexo"
          title="COMUNICADOS IMPORTANTES."
          description="Promoções, manutenções e avisos publicados pela equipe."
        />

        {isLoading && (
          <p className="section-state" role="status" aria-live="polite">
            Carregando comunicados...
          </p>
        )}
        {!isLoading && error && (
          <p className="section-state section-state--error" role="alert">
            {error}
          </p>
        )}
        {!isLoading && !error && (
          <div className="announcements__grid">
            {comunicados.map((comunicado) => (
              <article className="announcement-card" key={comunicado.id}>
                <Megaphone aria-hidden="true" size={20} />
                <div>
                  <h3>{comunicado.titulo}</h3>
                  <p>{comunicado.mensagem}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
