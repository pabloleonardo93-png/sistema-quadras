import { useState } from "react";
import { KeyRound, Mail, MailCheck, RefreshCw, Send, ShieldCheck } from "lucide-react";
import {
  confirmarCodigoEmail,
  solicitarCodigoEmail,
} from "../services/emailVerificationService";
import { Button } from "./Button";

export function EmailVerificationAccess({ onVerified }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [requestInfo, setRequestInfo] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const response = await solicitarCodigoEmail(email);
      setEmail(response.email);
      setCode("");
      setRequestInfo(response);
      setFeedback("Enviamos um codigo de 6 digitos para este e-mail.");
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel enviar o codigo.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      const response = await confirmarCodigoEmail(email, code);
      onVerified(response);
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel validar o codigo.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (requestInfo) {
      void confirmCode();
      return;
    }
    void sendCode();
  };

  return (
    <section className="my-reservations-access" aria-labelledby="access-title">
      <span className="my-reservations-access__icon">
        <MailCheck aria-hidden="true" size={30} />
      </span>
      <div className="my-reservations-access__copy">
        <h2 id="access-title">Confirme seu e-mail</h2>
        <span>
          Informe o mesmo e-mail utilizado na reserva.
          <br />
          Enviaremos um código de acesso — nenhuma senha é necessária.
        </span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          E-mail
          <span className="my-reservations-access__field">
            <Mail aria-hidden="true" size={19} />
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setRequestInfo(null);
                setCode("");
              }}
              disabled={busy}
              placeholder="voce@email.com"
            />
          </span>
        </label>
        {requestInfo && (
          <label>
            Código recebido
            <span className="my-reservations-access__field">
              <KeyRound aria-hidden="true" size={19} />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={busy}
                placeholder="000000"
              />
            </span>
          </label>
        )}
        <Button
          className="my-reservations-access__submit"
          type="submit"
          disabled={busy || !email.trim() || Boolean(requestInfo && code.length !== 6)}
        >
          {busy ? (
            <RefreshCw className="my-reservations-access__spinner" aria-hidden="true" size={18} />
          ) : requestInfo ? (
            <KeyRound aria-hidden="true" size={18} />
          ) : (
            <Send aria-hidden="true" size={18} />
          )}
          {busy ? "Aguarde..." : requestInfo ? "Validar código" : "Enviar código"}
        </Button>
      </form>

      {feedback && <p className="my-reservations-feedback" role="status">{feedback}</p>}
      {error && <p className="my-reservations-error" role="alert">{error}</p>}
      <p className="my-reservations-access__security">
        <ShieldCheck aria-hidden="true" size={19} />
        Seu e-mail é usado somente para localizar suas reservas.
      </p>
    </section>
  );
}
