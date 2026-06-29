import { ArrowUpRight, CircleDot } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

export function ModalidadesSection({
  error = "",
  isLoading = false,
  modalities = [],
  onSelect,
}) {
  return (
    <section className="section modalities" id="modalidades">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Escolha seu jogo"
          title="TRÊS JEITOS DE ENTRAR NA AREIA."
          description="Do primeiro saque ao último ponto, você encontra a estrutura certa para jogar no seu ritmo."
        />

        <div className="modalities__grid">
          {isLoading && <p className="section-state">Carregando modalidades...</p>}
          {!isLoading && error && <p className="section-state section-state--error">{error}</p>}
          {!isLoading && !error && modalities.length === 0 && (
            <p className="section-state">Nenhuma modalidade encontrada.</p>
          )}
          {!isLoading && !error && modalities.map((modality, index) => {
            const Icon = modality.icon || CircleDot;
            return (
              <article
                className={`modality-card modality-card--${modality.accent || "coral"}`}
                key={modality.id}
              >
                <div className="modality-card__top">
                  <span className="modality-card__number">
                    0{index + 1}
                  </span>
                  <Icon aria-hidden="true" size={34} strokeWidth={1.7} />
                </div>
                <span className="modality-card__eyebrow">{modality.eyebrow || "Arena Onda"}</span>
                <h3>{modality.name}</h3>
                <p>{modality.description}</p>
                <button type="button" onClick={() => onSelect(modality.name)}>
                  Escolher modalidade
                  <ArrowUpRight aria-hidden="true" size={18} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
