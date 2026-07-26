import { ArrowLeft, Cookie, ShieldCheck } from "lucide-react";
import { brand } from "../constants/brand";
import { requestCookiePreferences } from "../services/cookieConsentService";
import "./PrivacyCookiesPage.css";

const storageItems = [
  {
    title: "Essencial",
    description:
      "Token de verificacao de e-mail, sessao administrativa e preferencias tecnicas necessarias para reserva, acesso e seguranca.",
    choice: "Sempre ativo",
  },
  {
    title: "Medicao de acessos",
    description:
      "Identificador pseudonimo de visitante, pagina acessada e origem da visita para entender o uso das etapas de reserva.",
    choice: "Opcional",
  },
];

export default function PrivacyCookiesPage() {
  return (
    <main className="privacy-page">
      <div className="privacy-page__shell">
        <a className="privacy-page__back" href="/#inicio">
          <ArrowLeft aria-hidden="true" size={18} />
          Voltar ao inicio
        </a>

        <header className="privacy-page__hero">
          <span className="privacy-page__eyebrow">Pé na Areia</span>
          <h1>Privacidade e cookies</h1>
          <p>
            Esta pagina explica os dados usados pelo {brand.name} para viabilizar
            reservas, verificacao de e-mail, pagamentos e melhoria da experiencia.
          </p>
        </header>

        <section className="privacy-page__section" aria-labelledby="dados-title">
          <div className="privacy-page__section-title">
            <ShieldCheck aria-hidden="true" size={22} />
            <h2 id="dados-title">Dados tratados no sistema</h2>
          </div>
          <p>
            Para criar uma reserva, o sistema solicita nome, telefone e e-mail. O
            e-mail e confirmado por codigo antes do pagamento. A reserva tambem
            registra a quadra, horario e situacao do pagamento. Quando aplicavel,
            o pagamento e processado pelo Mercado Pago.
          </p>
        </section>

        <section className="privacy-page__section" aria-labelledby="cookies-title">
          <div className="privacy-page__section-title">
            <Cookie aria-hidden="true" size={22} />
            <h2 id="cookies-title">Cookies e armazenamento do navegador</h2>
          </div>
          <div className="privacy-page__storage-list">
            {storageItems.map((item) => (
              <article key={item.title} className="privacy-page__storage-item">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <span>{item.choice}</span>
              </article>
            ))}
          </div>
          <button type="button" className="button button--primary" onClick={requestCookiePreferences}>
            Gerenciar preferencias de cookies
          </button>
        </section>

        <section className="privacy-page__section" aria-labelledby="direitos-title">
          <h2 id="direitos-title">Suas escolhas</h2>
          <p>
            Voce pode aceitar ou recusar a medicao de acessos a qualquer momento.
            A recusa nao impede o uso da reserva. Para solicitar informacoes sobre
            seus dados, use os canais de contato disponiveis no site.
          </p>
        </section>
      </div>
    </main>
  );
}
