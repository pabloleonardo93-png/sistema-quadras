import { ArrowUpRight } from "lucide-react";
import { modalities } from "../constants/mockData";
import { SectionHeading } from "./SectionHeading";

export function ModalidadesSection({ onSelect }) {
  return (
    <section className="section modalities" id="modalidades">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Escolha seu jogo"
          title="TRÊS JEITOS DE ENTRAR NA AREIA."
          description="Do primeiro saque ao último ponto, você encontra a estrutura certa para jogar no seu ritmo."
        />

        <div className="modalities__grid">
          {modalities.map((modality, index) => {
            const Icon = modality.icon;
            return (
              <article
                className={`modality-card modality-card--${modality.accent}`}
                key={modality.id}
              >
                <div className="modality-card__top">
                  <span className="modality-card__number">
                    0{index + 1}
                  </span>
                  <Icon aria-hidden="true" size={34} strokeWidth={1.7} />
                </div>
                <span className="modality-card__eyebrow">{modality.eyebrow}</span>
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
