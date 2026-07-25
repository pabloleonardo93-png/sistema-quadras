import { Clock3, KeyRound, MailCheck, RefreshCw } from "lucide-react";
import { Button } from "../../../components/Button";

export function EmailVerificationStep({
  canResendEmailCode,
  emailCodeCountdown,
  emailCodeExpired,
  emailFeedback,
  emailResendCountdown,
  emailVerification,
  emailVerificationInfo,
  isEmailConfirming,
  isEmailSending,
  isEmailSessionLoading,
  onChange,
  onConfirmCode,
  onSendCode,
}) {
  return (
    <div className="email-verification" aria-live="polite">
      <div className="email-verification__header">
        <span>
          <MailCheck aria-hidden="true" size={20} />
        </span>
        <div>
          <strong>Confirme seu contato</strong>
          <small>O codigo vale por 10 minutos e protege o horario contra dados falsos.</small>
        </div>
      </div>

      {isEmailSessionLoading && !emailVerificationInfo && (
        <p className="form-success" role="status">
          Verificando se este navegador ja tem um e-mail confirmado.
        </p>
      )}

      <div className="form-grid">
        <label className="form-grid__full">
          E-mail
          <input
            name="email"
            type="email"
            placeholder="voce@email.com"
            value={emailVerification.email}
            onChange={onChange}
          />
        </label>

        {emailVerificationInfo && (
          <>
            <label>
              Codigo recebido
              <input
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={emailVerification.code}
                onChange={onChange}
              />
            </label>
            <div
              className={`email-verification__timer${
                emailCodeExpired ? " is-expired" : ""
              }`}
              role="status"
            >
              <Clock3 aria-hidden="true" size={18} />
              <span>
                <small>Codigo expira em</small>
                <strong>{emailCodeCountdown}</strong>
              </span>
            </div>
          </>
        )}
      </div>

      {emailFeedback && (
        <p className="form-success" role="status">
          {emailFeedback}
        </p>
      )}

      <div className="email-verification__actions">
        <Button
          type="button"
          onClick={onSendCode}
          disabled={isEmailSending || Boolean(emailVerificationInfo && !canResendEmailCode)}
        >
          <RefreshCw aria-hidden="true" size={18} />
          {isEmailSending
            ? "Enviando..."
            : emailVerificationInfo
              ? canResendEmailCode
                ? "Reenviar codigo"
                : `Reenviar em ${emailResendCountdown}`
              : "Enviar codigo"}
        </Button>

        {emailVerificationInfo && (
          <Button
            type="button"
            showArrow
            onClick={onConfirmCode}
            disabled={isEmailConfirming || emailCodeExpired}
          >
            <KeyRound aria-hidden="true" size={18} />
            {isEmailConfirming ? "Validando..." : "Validar codigo"}
          </Button>
        )}
      </div>
    </div>
  );
}
