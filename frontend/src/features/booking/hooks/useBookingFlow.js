import { useState } from "react";
import { useBookingSubmit } from "./useBookingSubmit";
import { useDadosCliente } from "./useDadosCliente";
import { useDisponibilidade } from "./useDisponibilidade";
import { usePagamento } from "./usePagamento";
import { useVerificacaoEmail } from "./useVerificacaoEmail";

export function useBookingFlow({
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
  const [error, setError] = useState("");
  const pagamento = usePagamento();
  const disponibilidade = useDisponibilidade({
    courts,
    initialDate,
    initialTimeId,
    isCustomerDataRoute,
    modalities,
    onCourtChange,
    onModalityChange,
    onResetReservationProgress: pagamento.resetPaymentState,
    selectedCourt,
    selectedModality,
    setError,
  });
  const dadosCliente = useDadosCliente({
    onResetPaymentState: pagamento.resetPaymentState,
  });
  const showCustomerDataStep = isCustomerDataRoute || disponibilidade.mostrarDados;
  const verificacaoEmail = useVerificacaoEmail({
    customer: dadosCliente.customer,
    customerProfileLoaded: dadosCliente.customerProfileLoaded,
    onResetPaymentState: pagamento.resetPaymentState,
    setCustomer: dadosCliente.setCustomer,
    setCustomerProfileLoaded: dadosCliente.setCustomerProfileLoaded,
    setError,
    showCustomerDataStep,
  });
  const isEmailVerificationStepOpen =
    showCustomerDataStep && !verificacaoEmail.verifiedEmail && !pagamento.isPaymentStepOpen;
  const emailStepNumber = isCustomerDataRoute ? "01" : "03";
  const customerStepNumber = isCustomerDataRoute
    ? pagamento.isPaymentStepOpen
      ? "03"
      : "02"
    : "03";
  const validateBooking = () =>
    dadosCliente.validateBooking({
      date: disponibilidade.date,
      selectedCourt,
      selectedCourtData: disponibilidade.selectedCourtData,
      selectedHorario: disponibilidade.selectedHorario,
      selectedModality,
      selectedModalityData: disponibilidade.selectedModalityData,
      selectedTime: disponibilidade.selectedTime,
      verifiedEmail: verificacaoEmail.verifiedEmail,
    });
  const submit = useBookingSubmit({
    checkoutExpired: pagamento.checkoutExpired,
    checkoutInfo: pagamento.checkoutInfo,
    closePaymentStep: pagamento.closePaymentStep,
    customer: dadosCliente.customer,
    isEmailVerificationStepOpen,
    isPaymentStepOpen: pagamento.isPaymentStepOpen,
    onEmailVerificationSubmit: verificacaoEmail.handleEmailVerificationSubmit,
    openPaymentStep: pagamento.openPaymentStep,
    paymentMethod: pagamento.paymentMethod,
    selectedCourtData: disponibilidade.selectedCourtData,
    selectedHorario: disponibilidade.selectedHorario,
    selectedModalityData: disponibilidade.selectedModalityData,
    setError,
    showCustomerDataStep,
    startCheckoutPayment: pagamento.startCheckoutPayment,
    startPixPayment: pagamento.startPixPayment,
    validateBooking,
    verifiedEmail: verificacaoEmail.verifiedEmail,
  });

  const resetBooking = () => {
    submit.resetSubmitState();
    dadosCliente.resetCustomer();
    verificacaoEmail.resetEmailVerification();
    verificacaoEmail.resetEmailSessionChecked();
    dadosCliente.setCustomerProfileLoaded(false);
    pagamento.resetPaymentState();
    disponibilidade.closeCustomerDataStep();
  };

  return {
    availableTimes: disponibilidade.availableTimes,
    canResendEmailCode: verificacaoEmail.canResendEmailCode,
    checkoutCountdown: pagamento.checkoutCountdown,
    checkoutExpired: pagamento.checkoutExpired,
    checkoutInfo: pagamento.checkoutInfo,
    confirmed: submit.confirmed,
    courts: disponibilidade.courts,
    customer: dadosCliente.customer,
    customerStepNumber,
    dataFormatada: disponibilidade.dataFormatada,
    date: disponibilidade.date,
    dateInputRef: disponibilidade.dateInputRef,
    emailCodeCountdown: verificacaoEmail.emailCodeCountdown,
    emailCodeExpired: verificacaoEmail.emailCodeExpired,
    emailFeedback: verificacaoEmail.emailFeedback,
    emailResendCountdown: verificacaoEmail.emailResendCountdown,
    emailStepNumber,
    emailVerification: verificacaoEmail.emailVerification,
    emailVerificationInfo: verificacaoEmail.emailVerificationInfo,
    error,
    handleBackToCustomerData: pagamento.handleBackToCustomerData,
    handleChangeVerifiedEmail: verificacaoEmail.handleChangeVerifiedEmail,
    handleConfirmEmailCode: verificacaoEmail.handleConfirmEmailCode,
    handleCopyPixCode: pagamento.handleCopyPixCode,
    handleCourtChange: disponibilidade.handleCourtChange,
    handleCustomerChange: dadosCliente.handleCustomerChange,
    handleDateChange: disponibilidade.handleDateChange,
    handleEmailVerificationChange: verificacaoEmail.handleEmailVerificationChange,
    handleFormSubmit: submit.handleFormSubmit,
    handleModalityChange: disponibilidade.handleModalityChange,
    handleOpenDatePicker: disponibilidade.handleOpenDatePicker,
    handlePaymentMethodChange: pagamento.handlePaymentMethodChange,
    handleSendEmailCode: verificacaoEmail.handleSendEmailCode,
    handleTimeSelect: disponibilidade.handleTimeSelect,
    handleContinueToCustomerData: disponibilidade.handleContinueToCustomerData,
    isCustomerDataRoute,
    isEmailConfirming: verificacaoEmail.isEmailConfirming,
    isEmailSending: verificacaoEmail.isEmailSending,
    isEmailSessionLoading: verificacaoEmail.isEmailSessionLoading,
    isEmailVerificationStepOpen,
    isPaymentStepOpen: pagamento.isPaymentStepOpen,
    isSubmitting: submit.isSubmitting,
    modalities: disponibilidade.modalities,
    paymentMethod: pagamento.paymentMethod,
    pixCopyFeedback: pagamento.pixCopyFeedback,
    resetBooking,
    selectedCourt: disponibilidade.selectedCourt,
    selectedCourtData: disponibilidade.selectedCourtData,
    selectedHorario: disponibilidade.selectedHorario,
    selectedModality: disponibilidade.selectedModality,
    selectedTime: disponibilidade.selectedTime,
    showCustomerDataStep,
    successMessage: submit.successMessage,
    timesError: disponibilidade.timesError,
    timesLoading: disponibilidade.timesLoading,
    valorFormatado: disponibilidade.valorFormatado,
    verifiedEmail: verificacaoEmail.verifiedEmail,
  };
}
