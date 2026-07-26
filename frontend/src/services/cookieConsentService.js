const COOKIE_CONSENT_STORAGE_KEY = "pe_na_areia_cookie_consent";

export const COOKIE_CONSENT_EVENT = "pe-na-areia:cookie-preferences";

export function getCookieConsent() {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === "accepted";
}

export function saveCookieConsent(consent) {
  if (consent !== "accepted" && consent !== "rejected") return;

  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, consent);
  } catch {
    // A preferencia fica valida na sessao atual quando o armazenamento esta bloqueado.
  }
}

export function requestCookiePreferences() {
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}
