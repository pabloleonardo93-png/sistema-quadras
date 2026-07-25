import { useState } from "react";
import {
  criarReservaComCheckout,
  criarReservaComPix,
  registrarPagamentoGeradoReserva,
} from "../services/bookingService";

export function useBookingSubmit({
  checkoutExpired,
  checkoutInfo,
  closePaymentStep,
  customer,
  isEmailVerificationStepOpen,
  isPaymentStepOpen,
  onEmailVerificationSubmit,
  openPaymentStep,
  paymentMethod,
  selectedCourtData,
  selectedHorario,
  selectedModalityData,
  setError,
  showCustomerDataStep,
  startCheckoutPayment,
  startPixPayment,
  validateBooking,
  verifiedEmail,
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinueToPayment = (event) => {
    event.preventDefault();
    const validationError = validateBooking();

    if (validationError) {
      closePaymentStep();
      setError(validationError);
      return;
    }

    setError("");
    openPaymentStep();
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
      closePaymentStep();
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
        ? await criarReservaComPix(payload)
        : await criarReservaComCheckout(payload);

      if (paymentMethod === "pix" && pagamentoResponse.pix) {
        registrarPagamentoGeradoReserva(
          `${window.location.pathname}${window.location.search}#pix-gerado`,
        );
        startPixPayment(pagamentoResponse);
        setSuccessMessage("Pix gerado. O horario fica reservado enquanto o pagamento estiver dentro do prazo.");
        return;
      }

      if (pagamentoResponse.checkoutUrl) {
        registrarPagamentoGeradoReserva(
          `${window.location.pathname}${window.location.search}#checkout-gerado`,
        );
        startCheckoutPayment(pagamentoResponse);
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
        setError("Pagamento online ainda não configurado. Configure o Mercado Pago no sistema.");
      } else {
        setError(errorMessage || "Erro ao conectar com o sistema. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event) => {
    if (isPaymentStepOpen) {
      handlePaymentSubmit(event);
      return;
    }

    if (isEmailVerificationStepOpen) {
      onEmailVerificationSubmit(event);
      return;
    }

    if (showCustomerDataStep && verifiedEmail) {
      handleContinueToPayment(event);
      return;
    }

    event.preventDefault();
  };

  const resetSubmitState = () => {
    setConfirmed(false);
    setSuccessMessage("");
  };

  return {
    confirmed,
    handleContinueToPayment,
    handleFormSubmit,
    handlePaymentSubmit,
    isSubmitting,
    resetSubmitState,
    successMessage,
  };
}
