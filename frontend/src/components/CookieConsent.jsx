import { useEffect, useState } from "react";
import { Check, Cookie } from "lucide-react";
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
  saveCookieConsent,
} from "../services/cookieConsentService";
import "./CookieConsent.css";

const confirmationMessages = {
  accepted: "Preferencia salva. A medicao de acessos foi ativada.",
  rejected: "Preferencia salva. Apenas o armazenamento essencial permanece ativo.",
};

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(() => !getCookieConsent());
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    const openPreferences = () => {
      setConfirmation("");
      setIsOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_EVENT, openPreferences);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    if (!confirmation) return undefined;

    const timer = window.setTimeout(() => setConfirmation(""), 3200);
    return () => window.clearTimeout(timer);
  }, [confirmation]);

  const savePreference = (consent) => {
    saveCookieConsent(consent);
    setIsOpen(false);
    setConfirmation(confirmationMessages[consent]);
  };

  if (!isOpen && !confirmation) return null;

  return (
    <div className="cookie-consent" aria-live="polite">
      {isOpen ? (
        <section className="cookie-consent__panel" aria-label="Preferencias de cookies">
          <div className="cookie-consent__icon" aria-hidden="true">
            <Cookie size={22} />
          </div>
          <div className="cookie-consent__content">
            <h2>Privacidade e cookies</h2>
            <p>
              Usamos o armazenamento essencial para reserva, verificacao de e-mail e
              acesso administrativo. Com sua autorizacao, tambem registramos acessos
              pseudonimos para melhorar a jornada de reserva.
            </p>
            <a href="/privacidade-e-cookies">Conheca a politica de privacidade e cookies</a>
          </div>
          <div className="cookie-consent__actions">
            <button type="button" className="button button--secondary" onClick={() => savePreference("rejected")}>
              Recusar opcionais
            </button>
            <button type="button" className="button button--primary" onClick={() => savePreference("accepted")}>
              Aceitar cookies
            </button>
          </div>
        </section>
      ) : (
        <div className="cookie-consent__confirmation" role="status">
          <Check aria-hidden="true" size={18} />
          <span>{confirmation}</span>
        </div>
      )}
    </div>
  );
}
