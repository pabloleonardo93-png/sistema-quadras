import { useEffect, useState } from "react";
import { formatRemainingTime } from "../../../shared/formatters/tempo";
import { registrarVisualizacaoPagamentoReserva } from "../services/bookingService";

export function usePagamento() {
  const [isPaymentStepOpen, setIsPaymentStepOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [pixCopyFeedback, setPixCopyFeedback] = useState("");
  const [countdownNow, setCountdownNow] = useState(() => Date.now());

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
    if (!checkoutInfo?.pagamentoExpiraEm) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCountdownNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [checkoutInfo?.pagamentoExpiraEm]);

  const resetPaymentState = () => {
    setIsPaymentStepOpen(false);
    setCheckoutInfo(null);
    setPixCopyFeedback("");
  };

  const openPaymentStep = () => {
    setIsPaymentStepOpen(true);
    registrarVisualizacaoPagamentoReserva(
      `${window.location.pathname}${window.location.search}#pagamento`,
    );
  };

  const closePaymentStep = () => {
    setIsPaymentStepOpen(false);
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

  const handlePaymentMethodChange = (method) => {
    if (!checkoutInfo) setPaymentMethod(method);
  };

  const startPixPayment = (pagamentoResponse) => {
    setCountdownNow(Date.now());
    setCheckoutInfo({
      tipo: "pix",
      pix: pagamentoResponse.pix,
      pagamentoExpiraEm: pagamentoResponse.pagamentoExpiraEm,
      tempoPagamentoMinutos: pagamentoResponse.tempoPagamentoMinutos,
    });
  };

  const startCheckoutPayment = (pagamentoResponse) => {
    setCountdownNow(Date.now());
    setCheckoutInfo({
      tipo: "checkout",
      checkoutUrl: pagamentoResponse.checkoutUrl,
      pagamentoExpiraEm: pagamentoResponse.pagamentoExpiraEm,
      tempoPagamentoMinutos: pagamentoResponse.tempoPagamentoMinutos,
    });
  };

  return {
    checkoutCountdown,
    checkoutExpired,
    checkoutInfo,
    closePaymentStep,
    handleBackToCustomerData: closePaymentStep,
    handleCopyPixCode,
    handlePaymentMethodChange,
    isPaymentStepOpen,
    openPaymentStep,
    paymentMethod,
    pixCopyFeedback,
    resetPaymentState,
    startCheckoutPayment,
    startPixPayment,
  };
}
