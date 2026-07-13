import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  ChevronLeft,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  KeyRound,
  Lock,
  MailCheck,
  MapPin,
  PartyPopper,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { arenaInfo } from "../constants/arenaInfo";
import { brand } from "../constants/brand";
import { buscarMeuCliente } from "../services/clienteService";
import {
  buscarSessaoEmail,
  confirmarCodigoEmail,
  limparSessaoEmailSalva,
  solicitarCodigoEmail,
} from "../services/emailVerificationService";
import { listarHorariosDisponiveis } from "../services/horarioService";
import {
  criarReservaPublicaComPagamento,
  criarReservaPublicaComPix,
} from "../services/reservaService";
import { Button } from "./Button";
import { HorariosDisponiveis } from "./HorariosDisponiveis";
import { SectionHeading } from "./SectionHeading";

const isDateParam = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "");

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isOpenDate = (value) =>
  isDateParam(value) && new Date(`${value}T12:00:00`).getDay() !== 1;

const getNextOpenDate = () => {
  const date = new Date();

  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() === 1);

  return formatDateInput(date);
};

const emptyCustomer = { name: "", phone: "", email: "" };
const emptyEmailVerification = { email: "", code: "" };
const PHONE_MIN_DIGITS = 10;
const PHONE_MAX_DIGITS = 11;
const VALID_BRAZILIAN_DDDS = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

const getPhoneDigits = (value) => value.replace(/\D/g, "");

const normalizeBrazilianPhone = (value) => {
  const digits = getPhoneDigits(value);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
};

const validateBrazilianPhone = (value) => {
  const digits = normalizeBrazilianPhone(value);
  if (![PHONE_MIN_DIGITS, PHONE_MAX_DIGITS].includes(digits.length)) {
    return "Informe um telefone com DDD e 10 ou 11 digitos.";
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
    return "Informe um DDD valido.";
  }

  if (/^(\d)\1+$/.test(digits) || /^(\d)\1+$/.test(number)) {
    return "Informe um telefone valido.";
  }

  if (digits.length === PHONE_MAX_DIGITS && digits[2] !== "9") {
    return "Telefone celular deve comecar com 9 apos o DDD.";
  }

  return "";
};

const formatRemainingTime = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const formatPhone = (value) => {
  const digits = normalizeBrazilianPhone(value).slice(0, PHONE_MAX_DIGITS);

  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export function ReservaRapida({
  courts = [],
  modalities = [],
  selectedModality,
  selectedCourt,
  initialDate,
  initialTimeId,
  isCustomerDataRoute = false,
  onModalityChange,
  onCourtChange,
}) {
  const navigate = useNavigate();
  const [date, setDate] = useState(() =>
    isDateParam(initialDate) ? initialDate : getNextOpenDate(),
  );
  const [selectedTime, setSelectedTime] = useState(() =>
    initialTimeId ? String(initialTimeId) : "",
  );
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [customer, setCustomer] = useState(emptyCustomer);
  const [emailVerification, setEmailVerification] = useState(emptyEmailVerification);
  const [emailVerificationInfo, setEmailVerificationInfo] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isEmailConfirming, setIsEmailConfirming] = useState(false);
  const [isEmailSessionLoading, setIsEmailSessionLoading] = useState(false);
  const [emailSessionChecked, setEmailSessionChecked] = useState(false);
  const [customerProfileLoaded, setCustomerProfileLoaded] = useState(false);
  const [mostrarDados, setMostrarDados] = useState(isCustomerDataRoute);
  const [isPaymentStepOpen, setIsPaymentStepOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [pixCopyFeedback, setPixCopyFeedback] = useState("");
  const [countdownNow, setCountdownNow] = useState(() => Date.now());
  const preferredTimeRef = useRef("");
  const dateInputRef = useRef(null);

  const selectedCourtData = useMemo(
    () => courts.find((court) => court.id === selectedCourt),
    [courts, selectedCourt],
  );

  const selectedModalityData = useMemo(
    () => modalities.find((modality) => modality.name === selectedModality),
    [modalities, selectedModality],
  );

  const selectedHorario = useMemo(
    () => availableTimes.find((time) => time.id === selectedTime),
    [availableTimes, selectedTime],
  );

  const valorFormatado = Number(selectedCourtData?.valorHora || 0)
    .toFixed(2)
    .replace(".", ",");

  const dataFormatada = date
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`))
    : "--";
  const showCustomerDataStep = isCustomerDataRoute || mostrarDados;
  const isEmailVerificationStepOpen = showCustomerDataStep && !verifiedEmail && !isPaymentStepOpen;
  const emailStepNumber = isCustomerDataRoute ? "01" : "03";
  const customerStepNumber = isCustomerDataRoute
    ? isPaymentStepOpen
      ? "03"
      : "02"
    : "03";
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
  const checkoutExpiresAt = checkoutInfo?.pagamentoExpiraEm
    ? new Date(checkoutInfo.pagamentoExpiraEm).getTime()
    : null;
  const checkoutRemainingMs = checkoutExpiresAt
    ? checkoutExpiresAt - countdownNow
    : 0;
  const checkoutExpired = Boolean(checkoutInfo && checkoutRemainingMs <= 0);
  const checkoutCountdown = checkoutInfo
    ? formatRemainingTime(checkoutRemainingMs)
    : "";

  useEffect(() => {
    if (
      !checkoutInfo?.pagamentoExpiraEm &&
      !emailVerificationInfo?.expiraEm &&
      !emailVerificationInfo?.reenvioLiberadoEm
    ) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [
    checkoutInfo?.pagamentoExpiraEm,
    emailVerificationInfo?.expiraEm,
    emailVerificationInfo?.reenvioLiberadoEm,
  ]);

  useEffect(() => {
    let active = true;

    async function carregarHorarios() {
      if (!selectedCourtData?.apiId || !date) {
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesLoading(false);
        setTimesError("");
        return;
      }

      if (!isOpenDate(date)) {
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesLoading(false);
        setTimesError("A arena funciona de terça a domingo, das 08:00 às 22:00.");
        return;
      }

      setTimesLoading(true);
      setTimesError("");

      try {
        const horarios = await listarHorariosDisponiveis({
          quadraId: selectedCourtData.apiId,
          modalidadeId: selectedModalityData?.apiId,
          data: date,
        });

        if (!active) return;

        const horariosDaQuadra = horarios.filter((horario) => {
          const horaInicio = String(horario.horaInicio || "").slice(0, 5);
          return (
            Number(horario.quadraId) === Number(selectedCourtData.apiId) &&
            horaInicio >= "08:00" &&
            horaInicio < "22:00"
          );
        });
        const horariosUnicos = Array.from(
          new Map(
            horariosDaQuadra.map((horario) => [
              String(horario.horaInicio || "").slice(0, 5),
              horario,
            ]),
          ).values(),
        );

        const normalizados = horariosUnicos.map((horario) => ({
          id: String(horario.id),
          apiId: horario.id,
          time: String(horario.horaInicio || "").slice(0, 5),
          available: horario.status === "disponivel",
        }));

        setAvailableTimes(normalizados);
        setSelectedTime((current) => {
          const requestedTime = initialTimeId ? String(initialTimeId) : "";

          if (
            requestedTime &&
            normalizados.some((horario) => horario.id === requestedTime && horario.available)
          ) {
            return requestedTime;
          }

          const currentHorario = normalizados.find(
            (horario) => horario.id === current && horario.available,
          );

          if (currentHorario) {
            preferredTimeRef.current = currentHorario.time;
            return current;
          }

          const horarioPreferido = normalizados.find(
            (horario) => horario.available && horario.time === preferredTimeRef.current,
          );

          return horarioPreferido?.id || "";
        });
      } catch {
        if (!active) return;
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesError("Não foi possível carregar os horários disponíveis.");
      } finally {
        if (active) setTimesLoading(false);
      }
    }

    carregarHorarios();

    return () => {
      active = false;
    };
  }, [date, initialTimeId, selectedCourtData?.apiId, selectedModalityData?.apiId]);

  useEffect(() => {
    let active = true;

    async function carregarSessaoEmail() {
      if (!showCustomerDataStep || verifiedEmail || emailSessionChecked) return;

      setIsEmailSessionLoading(true);

      try {
        const sessao = await buscarSessaoEmail();
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
  }, [emailSessionChecked, showCustomerDataStep, verifiedEmail]);

  useEffect(() => {
    let active = true;

    async function carregarClienteValidado() {
      if (!verifiedEmail?.email || customerProfileLoaded) return;

      try {
        const cliente = await buscarMeuCliente();
        if (!active || !cliente) return;

        setCustomer((current) => ({
          ...current,
          name: current.name || cliente.nome || "",
          phone: current.phone || formatPhone(cliente.telefone || ""),
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
  }, [customerProfileLoaded, verifiedEmail?.email]);

  const resetPaymentState = () => {
    setIsPaymentStepOpen(false);
    setCheckoutInfo(null);
    setPixCopyFeedback("");
  };

  const resetEmailVerification = (email = "") => {
    setVerifiedEmail(null);
    setEmailVerification({ email, code: "" });
    setEmailVerificationInfo(null);
    setEmailFeedback("");
    setCustomerProfileLoaded(false);
  };

  const resetReservationProgress = ({ keepSelectedTime = false } = {}) => {
    resetPaymentState();
    setMostrarDados(false);
    if (!keepSelectedTime) {
      preferredTimeRef.current = "";
      setSelectedTime("");
    }
  };

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    resetPaymentState();
    setCustomer((current) => ({
      ...current,
      [name]: name === "phone" ? formatPhone(value) : value,
    }));
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
      const sessao = await buscarSessaoEmail();
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

      const response = await solicitarCodigoEmail(emailVerification.email);
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
      const response = await confirmarCodigoEmail(emailVerification.email, emailVerification.code);
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
    resetPaymentState();
    setEmailSessionChecked(true);
    limparSessaoEmailSalva();
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

  const handleSelectionChange = (callback, options = {}) => (value) => {
    resetReservationProgress(options);
    callback(value);
  };

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    input.focus();
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      }
    } catch {
      // Alguns navegadores bloqueiam showPicker fora do gesto de clique.
    }
  };

  const handleDateChange = (value) => {
    resetReservationProgress({ keepSelectedTime: true });
    setDate(value);
  };

  const handleContinueToCustomerData = () => {
    if (!selectedHorario?.apiId) {
      setError("Selecione um horário disponível para continuar.");
      return;
    }

    const params = new URLSearchParams({
      quadra: selectedCourt,
      modalidade: selectedModality,
      data: date,
      horario: String(selectedHorario.apiId),
    });

    setError("");
    navigate(`/reserva/dados?${params.toString()}`);
  };

  const validateBooking = () => {
    if (
      !selectedModality ||
      !selectedCourt ||
      !date ||
      !selectedTime ||
      !selectedCourtData?.apiId ||
      !selectedModalityData?.apiId ||
      !selectedHorario?.apiId ||
      !customer.name ||
      !customer.phone ||
      !customer.email ||
      !verifiedEmail?.email
    ) {
      return "Preencha todos os campos para continuar para o pagamento.";
    }

    if (customer.email !== verifiedEmail.email) {
      return "Valide o e-mail antes de continuar para o pagamento.";
    }

    return validateBrazilianPhone(customer.phone);
  };

  const handleContinueToPayment = (event) => {
    event.preventDefault();
    const validationError = validateBooking();

    if (validationError) {
      setIsPaymentStepOpen(false);
      setError(validationError);
      return;
    }

    setError("");
    setIsPaymentStepOpen(true);
  };

  const handleCopyPixCode = async () => {
    const pixCode = checkoutInfo?.pix?.qrCode;
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setPixCopyFeedback("Codigo Pix copiado.");
    } catch {
      setPixCopyFeedback("Selecione o codigo e copie manualmente.");
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    if (checkoutInfo?.pix) {
      if (checkoutExpired) {
        setError("O prazo para pagamento expirou. Escolha outro horario para iniciar uma nova reserva.");
      }
      return;
    }

    if (checkoutInfo?.checkoutUrl) {
      if (checkoutExpired) {
        setError("O prazo para pagamento expirou. Escolha outro horario para iniciar uma nova reserva.");
        return;
      }

      window.location.assign(checkoutInfo.checkoutUrl);
      return;
    }

    const validationError = validateBooking();

    if (validationError) {
      setIsPaymentStepOpen(false);
      setError(validationError);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        nome: customer.name,
        telefone: customer.phone,
        email: customer.email,
        emailVerificationToken: verifiedEmail.token || undefined,
        quadraId: selectedCourtData.apiId,
        modalidadeId: selectedModalityData.apiId,
        horarioId: selectedHorario.apiId,
      };

      const pagamentoResponse = paymentMethod === "pix"
        ? await criarReservaPublicaComPix(payload)
        : await criarReservaPublicaComPagamento(payload);

      if (paymentMethod === "pix" && pagamentoResponse.pix) {
        setCountdownNow(Date.now());
        setCheckoutInfo({
          tipo: "pix",
          pix: pagamentoResponse.pix,
          pagamentoExpiraEm: pagamentoResponse.pagamentoExpiraEm,
          tempoPagamentoMinutos: pagamentoResponse.tempoPagamentoMinutos,
        });
        setSuccessMessage("Pix gerado. O horario fica reservado enquanto o pagamento estiver dentro do prazo.");
        return;
      }

      if (pagamentoResponse.checkoutUrl) {
        setCountdownNow(Date.now());
        setCheckoutInfo({
          tipo: "checkout",
          checkoutUrl: pagamentoResponse.checkoutUrl,
          pagamentoExpiraEm: pagamentoResponse.pagamentoExpiraEm,
          tempoPagamentoMinutos: pagamentoResponse.tempoPagamentoMinutos,
        });
        setSuccessMessage("Checkout criado. O horario fica reservado enquanto o pagamento estiver dentro do prazo.");
        return;
      }
      setSuccessMessage("Reserva criada, mas o checkout de pagamento não retornou uma URL.");
      setConfirmed(true);
    } catch (requestError) {
      const errorMessage = requestError.message || "";
      if (requestError.status === 409 && /hor[aá]rio|reserva/i.test(errorMessage)) {
        setError("Esse horário acabou de ser reservado. Escolha outro horário.");
      } else if (requestError.status === 409) {
        setError(errorMessage || "Não foi possível continuar com esses dados.");
      } else if (requestError.status === 503) {
        setError("Pagamento online ainda não configurado. Configure o token do Mercado Pago no backend.");
      } else {
        setError(errorMessage || "Erro ao conectar com a API. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setConfirmed(false);
    setCustomer(emptyCustomer);
    setSuccessMessage("");
    resetEmailVerification();
    setEmailSessionChecked(false);
    setCustomerProfileLoaded(false);
    resetPaymentState();
    setMostrarDados(false);
  };

  return (
    <section className="booking section" id="reserva">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Reserva rápida"
          title="SEU HORÁRIO EM POUCOS TOQUES."
          inverse
        />

        <div className="booking__layout">
          <aside className="booking-summary">
            <div className="booking-summary__label">Seu jogo</div>
            <div className="booking-summary__court">
              <span>{selectedCourtData?.name || "Escolha a quadra"}</span>
              <small>{selectedModality || "Escolha a modalidade"}</small>
            </div>
            <div className="booking-summary__price">
              <span>Valor da reserva</span>
              <strong>R$ {valorFormatado}</strong>
            </div>
            {selectedCourtData?.image && (
              <div className="booking-summary__photo">
                <img
                  src={selectedCourtData.image}
                  alt={`Foto da ${selectedCourtData.name}`}
                />
              </div>
            )}
            <div className="booking-summary__meta">
              <span>
                <CalendarCheck aria-hidden="true" size={18} />
                {date
                  ? new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    }).format(new Date(`${date}T12:00:00`))
                  : "--"}
              </span>
              <span>
                <Clock3 aria-hidden="true" size={18} />
                {selectedHorario?.time || "--:--"}
              </span>
            </div>
            <div className="booking-summary__location">
              <MapPin aria-hidden="true" size={18} />
              <span>
                {brand.name}
                <small>{arenaInfo.neighborhood}</small>
              </span>
            </div>
            <p>Pagamento online com Pix direto por QR Code ou cartão no checkout seguro.</p>
          </aside>

          <div className="booking-panel">
            {confirmed ? (
              <div className="booking-confirmation" role="status">
                <span className="booking-confirmation__icon">
                  <PartyPopper aria-hidden="true" size={34} />
                </span>
                <span className="booking-confirmation__eyebrow">
                  Reserva solicitada
                </span>
                <h3>QUADRA NA AGENDA, {customer.name.split(" ")[0]}!</h3>
                <p>
                  {successMessage} A <strong>{selectedCourtData?.name}</strong>{" "}
                  foi solicitada para <strong>{selectedModality}</strong>, as{" "}
                  <strong>{selectedHorario?.time}</strong>.
                </p>
                <div className="booking-confirmation__code">
                  <span>Status</span>
                  <strong>Pendente</strong>
                </div>
                <Button variant="dark" onClick={resetBooking}>
                  <ChevronLeft aria-hidden="true" size={18} />
                  Fazer nova reserva
                </Button>
              </div>
            ) : (
              <form
                onSubmit={
                  isPaymentStepOpen
                    ? handlePaymentSubmit
                    : isEmailVerificationStepOpen
                      ? handleEmailVerificationSubmit
                    : showCustomerDataStep && verifiedEmail
                      ? handleContinueToPayment
                      : (event) => event.preventDefault()
                }
                noValidate
              >
                {!isCustomerDataRoute && (
                  <>
                <div className="form-section">
                  <div className="form-section__title">
                    <span>01</span>
                    <div>
                      <strong>Escolha a partida</strong>
                      <small>Modalidade, quadra e data</small>
                    </div>
                  </div>

                  <div className="form-grid form-grid--three">
                    <label>
                      Modalidade
                      <select
                        value={selectedModality}
                        onChange={(event) =>
                          handleSelectionChange(onModalityChange, { keepSelectedTime: true })(
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        {modalities.map((modality) => (
                          <option key={modality.id} value={modality.name}>
                            {modality.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Quadra
                      <select
                        value={selectedCourt}
                        onChange={(event) =>
                          handleSelectionChange(onCourtChange, { keepSelectedTime: true })(
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        {courts
                          .filter((court) => court.status !== "maintenance")
                          .map((court) => (
                            <option key={court.id} value={court.id}>
                              {court.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label>
                      Data
                      <input
                        ref={dateInputRef}
                        type="date"
                        value={date}
                        min={new Date().toISOString().split("T")[0]}
                        onClick={handleOpenDatePicker}
                        onFocus={handleOpenDatePicker}
                        onChange={(event) => handleDateChange(event.target.value)}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title">
                    <span>02</span>
                    <div>
                      <strong>Selecione o horário</strong>
                      <small>Disponibilidade real da API</small>
                    </div>
                  </div>
                  <HorariosDisponiveis
                    error={timesError}
                    isLoading={timesLoading}
                    selectedTime={selectedTime}
                    onSelect={(timeId) => {
                      const horarioSelecionado = availableTimes.find(
                        (horario) => horario.id === timeId,
                      );
                      preferredTimeRef.current = horarioSelecionado?.time || "";
                      resetReservationProgress({ keepSelectedTime: true });
                      setSelectedTime(timeId);
                    }}
                    times={availableTimes}
                  />
                  {selectedHorario?.apiId && !showCustomerDataStep && !isPaymentStepOpen && (
                    <div className="time-picker__continue">
                      <Button
                        type="button"
                        showArrow
                        onClick={handleContinueToCustomerData}
                      >
                        Continuar para preencher dados
                      </Button>
                    </div>
                  )}
                </div>
                  </>
                )}

                {showCustomerDataStep && (
                  <div className="form-section" id="dados-reserva">
                  <div className="form-section__title">
                    <span>{isEmailVerificationStepOpen ? emailStepNumber : customerStepNumber}</span>
                    <div>
                      <strong>
                        {isEmailVerificationStepOpen
                          ? "Validar e-mail"
                          : isPaymentStepOpen
                            ? "Pagamento"
                            : "Seus dados"}
                      </strong>
                      <small>
                        {isEmailVerificationStepOpen
                          ? "Receba um codigo antes de preencher a reserva"
                          : isPaymentStepOpen
                          ? paymentMethod === "pix"
                            ? "Pix direto com vencimento de 10 minutos"
                            : "Checkout seguro do Mercado Pago"
                          : "E-mail ja validado para esta reserva"}
                      </small>
                    </div>
                  </div>
                  {isEmailVerificationStepOpen ? (
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
                            onChange={handleEmailVerificationChange}
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
                                onChange={handleEmailVerificationChange}
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
                          onClick={handleSendEmailCode}
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
                            onClick={handleConfirmEmailCode}
                            disabled={isEmailConfirming || emailCodeExpired}
                          >
                            <KeyRound aria-hidden="true" size={18} />
                            {isEmailConfirming ? "Validando..." : "Validar codigo"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : isPaymentStepOpen ? (
                    <div className="payment-review" aria-live="polite">
                      <div className="payment-review__header">
                        <span>
                          {paymentMethod === "pix" ? (
                            <QrCode aria-hidden="true" size={20} />
                          ) : (
                            <ShieldCheck aria-hidden="true" size={20} />
                          )}
                        </span>
                        <div>
                          <strong>Forma de pagamento</strong>
                          <small>
                            Pix fica nesta tela; cartão abre o checkout seguro.
                          </small>
                        </div>
                      </div>
                      <div className="payment-methods" role="group" aria-label="Forma de pagamento">
                        <button
                          className={`payment-methods__option${
                            paymentMethod === "pix" ? " is-selected" : ""
                          }`}
                          type="button"
                          onClick={() => !checkoutInfo && setPaymentMethod("pix")}
                          aria-pressed={paymentMethod === "pix"}
                          disabled={Boolean(checkoutInfo)}
                        >
                          <QrCode aria-hidden="true" size={18} />
                          <span>
                            <strong>Pix direto</strong>
                            <small>QR Code e Copia e Cola por 10 minutos</small>
                          </span>
                        </button>
                        <button
                          className={`payment-methods__option${
                            paymentMethod === "card" ? " is-selected" : ""
                          }`}
                          type="button"
                          onClick={() => !checkoutInfo && setPaymentMethod("card")}
                          aria-pressed={paymentMethod === "card"}
                          disabled={Boolean(checkoutInfo)}
                        >
                          <CreditCard aria-hidden="true" size={18} />
                          <span>
                            <strong>Cartão no checkout</strong>
                            <small>Crédito ou débito quando disponível</small>
                          </span>
                        </button>
                      </div>
                      <div className="payment-review__grid">
                        <span>
                          <small>Quadra</small>
                          <strong>{selectedCourtData?.name}</strong>
                        </span>
                        <span>
                          <small>Modalidade</small>
                          <strong>{selectedModality}</strong>
                        </span>
                        <span>
                          <small>Data</small>
                          <strong>{dataFormatada}</strong>
                        </span>
                        <span>
                          <small>Horário</small>
                          <strong>{selectedHorario?.time}</strong>
                        </span>
                        <span>
                          <small>Cliente</small>
                          <strong>{customer.name}</strong>
                        </span>
                        <span>
                          <small>E-mail validado</small>
                          <strong>{customer.email}</strong>
                        </span>
                        <span>
                          <small>Valor da reserva</small>
                          <strong>R$ {valorFormatado}</strong>
                        </span>
                      </div>
                      {checkoutInfo?.pix && (
                        <div className="pix-payment" role="status">
                          <div className="pix-payment__qr">
                            {checkoutInfo.pix.qrCodeBase64 ? (
                              <img
                                src={`data:image/png;base64,${checkoutInfo.pix.qrCodeBase64}`}
                                alt="QR Code Pix para pagamento da reserva"
                              />
                            ) : (
                              <QrCode aria-hidden="true" size={88} />
                            )}
                          </div>
                          <div className="pix-payment__details">
                            <strong>Pix gerado pelo Mercado Pago</strong>
                            <small>
                              Escaneie o QR Code ou use o Pix Copia e Cola antes do contador zerar.
                            </small>
                            {checkoutInfo.pix.qrCode && (
                              <label>
                                Pix Copia e Cola
                                <textarea
                                  readOnly
                                  value={checkoutInfo.pix.qrCode}
                                  rows={4}
                                />
                              </label>
                            )}
                            <div className="pix-payment__actions">
                              {checkoutInfo.pix.qrCode && (
                                <button type="button" onClick={handleCopyPixCode}>
                                  <Copy aria-hidden="true" size={18} />
                                  Copiar codigo
                                </button>
                              )}
                              {checkoutInfo.pix.ticketUrl && (
                                <a
                                  href={checkoutInfo.pix.ticketUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink aria-hidden="true" size={18} />
                                  Abrir no Mercado Pago
                                </a>
                              )}
                            </div>
                            {pixCopyFeedback && (
                              <p className="pix-payment__feedback">{pixCopyFeedback}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {checkoutInfo && (
                        <div
                          className={`payment-countdown${
                            checkoutExpired ? " is-expired" : ""
                          }`}
                          role="status"
                        >
                          <Clock3 aria-hidden="true" size={20} />
                          <span>
                            <small>Tempo para concluir o pagamento</small>
                            <strong>{checkoutCountdown}</strong>
                          </span>
                          <p>
                            {checkoutExpired
                              ? "O prazo expirou e o horario sera liberado automaticamente."
                              : `Conclua o pagamento em ate ${checkoutInfo.tempoPagamentoMinutos || 10} minutos para confirmar a reserva.`}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                    <div className="verified-contact-notice" role="status">
                      <span>
                        <MailCheck aria-hidden="true" size={20} />
                      </span>
                      <div>
                        <strong>Contato confirmado</strong>
                        <small>{customer.email} ja foi verificado para continuar.</small>
                      </div>
                    </div>
                    <div className="form-grid">
                      <label>
                        Nome completo
                        <input
                          name="name"
                          type="text"
                          placeholder="Como podemos te chamar?"
                          value={customer.name}
                          onChange={handleCustomerChange}
                        />
                      </label>
                      <label>
                        Telefone / WhatsApp
                        <input
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={15}
                          placeholder="(11) 99999-9999"
                          value={customer.phone}
                          onChange={handleCustomerChange}
                        />
                      </label>
                      <div className="verified-email-field form-grid__full">
                        <label>
                          E-mail validado
                          <span className="locked-input">
                            <input
                              name="email"
                              type="email"
                              value={customer.email}
                              readOnly
                            />
                            <Lock aria-hidden="true" size={18} />
                          </span>
                        </label>
                        <button type="button" onClick={handleChangeVerifiedEmail}>
                          Trocar e-mail
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                  </div>
                )}

                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}

                {showCustomerDataStep && verifiedEmail && (
                  <div className="form-submit">
                  {isPaymentStepOpen ? (
                    <button
                      className="form-submit__back"
                      type="button"
                      onClick={() => setIsPaymentStepOpen(false)}
                    >
                      <ChevronLeft aria-hidden="true" size={18} />
                      Voltar aos dados
                    </button>
                  ) : (
                    <span>
                      <MailCheck aria-hidden="true" size={18} />
                      E-mail validado. Os dados serao usados para abrir o pagamento.
                    </span>
                  )}
                  <Button type="submit" showArrow disabled={isSubmitting || Boolean(checkoutInfo?.pix)}>
                    {isSubmitting
                      ? paymentMethod === "pix"
                        ? "Gerando Pix..."
                        : "Abrindo checkout..."
                      : checkoutInfo
                        ? checkoutInfo.pix
                          ? "Pix gerado"
                          : "Ir para checkout seguro"
                        : isPaymentStepOpen
                          ? paymentMethod === "pix"
                            ? "Gerar Pix"
                            : "Abrir checkout seguro"
                        : "Continuar para pagamento"}
                  </Button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
