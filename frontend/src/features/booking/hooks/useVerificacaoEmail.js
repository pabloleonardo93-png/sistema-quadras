import { useEffect, useState } from "react";
import { formatBrazilianPhone } from "../../../shared/formatters/telefone";
import { formatRemainingTime } from "../../../shared/formatters/tempo";
import {
  buscarClienteValidadoReserva,
  buscarSessaoEmailReserva,
  confirmarCodigoEmailReserva,
  limparSessaoEmailReserva,
  solicitarCodigoEmailReserva,
} from "../services/bookingService";

const emptyEmailVerification = { email: "", code: "" };

export function useVerificacaoEmail({
  customer,
  customerProfileLoaded,
  onResetPaymentState,
  setCustomer,
  setCustomerProfileLoaded,
  setError,
  showCustomerDataStep,
}) {
  const [emailVerification, setEmailVerification] = useState(emptyEmailVerification);
  const [emailVerificationInfo, setEmailVerificationInfo] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState("");
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isEmailConfirming, setIsEmailConfirming] = useState(false);
  const [isEmailSessionLoading, setIsEmailSessionLoading] = useState(false);
  const [emailSessionChecked, setEmailSessionChecked] = useState(false);
  const [countdownNow, setCountdownNow] = useState(() => Date.now());

  const emailCodeExpiresAt = emailVerificationInfo?.expiraEm
    ? new Date(emailVerificationInfo.expiraEm).getTime()
    : null;
  const emailResendAvailableAt = emailVerificationInfo?.reenvioLiberadoEm
    ? new Date(emailVerificationInfo.reenvioLiberadoEm).getTime()
    : null;
  const emailCodeRemainingMs = emailCodeExpiresAt
    ? emailCodeExpiresAt - countdownNow
    : 0;
  const emailResendRemainingMs = emailResendAvailableAt
    ? emailResendAvailableAt - countdownNow
    : 0;
  const emailCodeExpired = Boolean(emailVerificationInfo && emailCodeRemainingMs <= 0);
  const canResendEmailCode = Boolean(emailVerificationInfo && emailResendRemainingMs <= 0);
  const emailCodeCountdown = emailVerificationInfo
    ? formatRemainingTime(emailCodeRemainingMs)
    : "";
  const emailResendCountdown = emailVerificationInfo
    ? formatRemainingTime(emailResendRemainingMs)
    : "";

  useEffect(() => {
    if (!emailVerificationInfo?.expiraEm && !emailVerificationInfo?.reenvioLiberadoEm) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [emailVerificationInfo?.expiraEm, emailVerificationInfo?.reenvioLiberadoEm]);

  useEffect(() => {
    let active = true;

    async function carregarSessaoEmail() {
      if (!showCustomerDataStep || verifiedEmail || emailSessionChecked) return;

      setIsEmailSessionLoading(true);

      try {
        const sessao = await buscarSessaoEmailReserva();
        if (!active) return;

        if (sessao?.verificado && sessao.email) {
          setVerifiedEmail({
            email: sessao.email,
            token: "",
            tokenExpiraEm: sessao.tokenExpiraEm,
            validadoEm: sessao.validadoEm,
            viaSessao: true,
          });
          setCustomer((current) => ({
            ...current,
            email: sessao.email,
          }));
          setCustomerProfileLoaded(false);
          setEmailFeedback("Contato confirmado. Este e-mail ja foi verificado neste navegador.");
        }
      } catch {
        // Falha na consulta da sessao nao deve impedir o fluxo normal por codigo.
      } finally {
        if (active) {
          setIsEmailSessionLoading(false);
          setEmailSessionChecked(true);
        }
      }
    }

    carregarSessaoEmail();

    return () => {
      active = false;
    };
  }, [emailSessionChecked, setCustomer, setCustomerProfileLoaded, showCustomerDataStep, verifiedEmail]);

  useEffect(() => {
    let active = true;

    async function carregarClienteValidado() {
      if (!verifiedEmail?.email || customerProfileLoaded) return;

      try {
        const cliente = await buscarClienteValidadoReserva();
        if (!active || !cliente) return;

        setCustomer((current) => ({
          ...current,
          name: current.name || cliente.nome || "",
          phone: current.phone || formatBrazilianPhone(cliente.telefone || ""),
          email: verifiedEmail.email,
        }));
      } catch {
        // Se nao houver cadastro ainda, o cliente continua preenchendo normalmente.
      } finally {
        if (active) setCustomerProfileLoaded(true);
      }
    }

    carregarClienteValidado();

    return () => {
      active = false;
    };
  }, [customerProfileLoaded, setCustomer, setCustomerProfileLoaded, verifiedEmail?.email]);

  const resetEmailVerification = (email = "") => {
    setVerifiedEmail(null);
    setEmailVerification({ email, code: "" });
    setEmailVerificationInfo(null);
    setEmailFeedback("");
    setCustomerProfileLoaded(false);
  };

  const resetEmailSessionChecked = () => {
    setEmailSessionChecked(false);
  };

  const handleEmailVerificationChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setEmailFeedback("");
    setEmailVerification((current) => ({
      ...current,
      [name]: name === "code" ? value.replace(/\D/g, "").slice(0, 6) : value,
    }));

    if (name === "email") {
      setEmailVerificationInfo(null);
    }
  };

  const handleSendEmailCode = async () => {
    setError("");
    setEmailFeedback("");
    setIsEmailSending(true);

    try {
      let sessao = null;
      try {
        sessao = await buscarSessaoEmailReserva();
      } catch {
        // A consulta de sessao e apenas uma conveniencia; o fluxo por codigo continua.
      }

      const emailInformado = emailVerification.email.trim().toLowerCase();

      if (sessao?.verificado && sessao.email === emailInformado) {
        setVerifiedEmail({
          email: sessao.email,
          token: "",
          tokenExpiraEm: sessao.tokenExpiraEm,
          validadoEm: sessao.validadoEm,
          viaSessao: true,
        });
        setCustomer((current) => ({
          ...current,
          email: sessao.email,
        }));
        setEmailVerification({
          email: sessao.email,
          code: "",
        });
        setEmailVerificationInfo(null);
        setEmailSessionChecked(true);
        setCustomerProfileLoaded(false);
        setEmailFeedback("Contato confirmado. Este e-mail ja estava verificado neste navegador.");
        return;
      }

      const response = await solicitarCodigoEmailReserva(emailVerification.email);
      setCountdownNow(Date.now());
      setEmailVerification({
        email: response.email,
        code: "",
      });
      setEmailVerificationInfo({
        expiraEm: response.expiraEm,
        reenvioLiberadoEm: response.reenvioLiberadoEm,
        validadeMinutos: response.validadeMinutos,
      });
      setEmailFeedback("Enviamos um codigo de 6 digitos para esse e-mail.");
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel enviar o codigo por e-mail.");
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleConfirmEmailCode = async () => {
    if (emailCodeExpired) {
      setError("O codigo expirou. Solicite um novo codigo para continuar.");
      return;
    }

    setError("");
    setEmailFeedback("");
    setIsEmailConfirming(true);

    try {
      const response = await confirmarCodigoEmailReserva(
        emailVerification.email,
        emailVerification.code,
      );
      setVerifiedEmail({
        email: response.email,
        token: response.token,
        tokenExpiraEm: response.tokenExpiraEm,
        validadoEm: response.validadoEm,
      });
      setCustomer((current) => ({
        ...current,
        email: response.email,
      }));
      setEmailVerificationInfo(null);
      setEmailSessionChecked(true);
      setCustomerProfileLoaded(false);
      setEmailFeedback("E-mail validado. Agora preencha seus dados.");
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel validar o codigo.");
    } finally {
      setIsEmailConfirming(false);
    }
  };

  const handleChangeVerifiedEmail = () => {
    onResetPaymentState();
    setEmailSessionChecked(true);
    limparSessaoEmailReserva();
    resetEmailVerification(verifiedEmail?.email || customer.email);
    setCustomer((current) => ({ ...current, email: "" }));
  };

  const handleEmailVerificationSubmit = (event) => {
    event.preventDefault();
    if (emailVerificationInfo && !emailCodeExpired) {
      handleConfirmEmailCode();
      return;
    }
    handleSendEmailCode();
  };

  return {
    canResendEmailCode,
    emailCodeCountdown,
    emailCodeExpired,
    emailFeedback,
    emailResendCountdown,
    emailVerification,
    emailVerificationInfo,
    handleChangeVerifiedEmail,
    handleConfirmEmailCode,
    handleEmailVerificationChange,
    handleEmailVerificationSubmit,
    handleSendEmailCode,
    isEmailConfirming,
    isEmailSending,
    isEmailSessionLoading,
    resetEmailSessionChecked,
    resetEmailVerification,
    verifiedEmail,
  };
}
