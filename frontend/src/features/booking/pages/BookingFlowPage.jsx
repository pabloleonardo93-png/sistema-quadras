import { SectionHeading } from "../../../components/SectionHeading";
import { BookingConfirmation } from "../components/BookingConfirmation";
import { BookingSelectionSteps } from "../components/BookingSelectionSteps";
import { BookingSubmitActions } from "../components/BookingSubmitActions";
import { BookingSummary } from "../components/BookingSummary";
import { CustomerDataStep } from "../components/CustomerDataStep";
import { EmailVerificationStep } from "../components/EmailVerificationStep";
import { PaymentStep } from "../components/PaymentStep";
import { useBookingFlow } from "../hooks/useBookingFlow";

export function BookingFlowPage(props) {
  const booking = useBookingFlow(props);

  return (
    <section className="booking section" id="reserva">
      <div className="page-shell">
        <SectionHeading
          eyebrow="Reserva online"
          title="RESERVE SUA QUADRA."
          description="Escolha o jogo, confirme o melhor horário e finalize com pagamento seguro."
          inverse
        />

        <div className="booking__layout">
          <BookingSummary
            date={booking.date}
            selectedCourtData={booking.selectedCourtData}
            selectedHorario={booking.selectedHorario}
            selectedModality={booking.selectedModality}
            valorFormatado={booking.valorFormatado}
          />

          <div className="booking-panel">
            {booking.confirmed ? (
              <BookingConfirmation
                customer={booking.customer}
                onReset={booking.resetBooking}
                selectedCourtData={booking.selectedCourtData}
                selectedHorario={booking.selectedHorario}
                selectedModality={booking.selectedModality}
                successMessage={booking.successMessage}
              />
            ) : (
              <form onSubmit={booking.handleFormSubmit} noValidate>
                {!booking.isCustomerDataRoute && (
                  <BookingSelectionSteps
                    availableTimes={booking.availableTimes}
                    courts={booking.courts}
                    date={booking.date}
                    dateInputRef={booking.dateInputRef}
                    isPaymentStepOpen={booking.isPaymentStepOpen}
                    modalities={booking.modalities}
                    onContinueToCustomerData={booking.handleContinueToCustomerData}
                    onCourtChange={booking.handleCourtChange}
                    onDateChange={booking.handleDateChange}
                    onModalityChange={booking.handleModalityChange}
                    onOpenDatePicker={booking.handleOpenDatePicker}
                    onTimeSelect={booking.handleTimeSelect}
                    selectedCourt={booking.selectedCourt}
                    selectedHorario={booking.selectedHorario}
                    selectedModality={booking.selectedModality}
                    selectedTime={booking.selectedTime}
                    showCustomerDataStep={booking.showCustomerDataStep}
                    timesError={booking.timesError}
                    timesLoading={booking.timesLoading}
                  />
                )}

                {booking.showCustomerDataStep && (
                  <div className="form-section" id="dados-reserva">
                    <div className="form-section__title">
                      <span>
                        {booking.isEmailVerificationStepOpen
                          ? booking.emailStepNumber
                          : booking.customerStepNumber}
                      </span>
                      <div>
                        <strong>
                          {booking.isEmailVerificationStepOpen
                            ? "Validar e-mail"
                            : booking.isPaymentStepOpen
                              ? "Pagamento"
                              : "Seus dados"}
                        </strong>
                        <small>
                          {booking.isEmailVerificationStepOpen
                            ? "Receba um codigo antes de preencher a reserva"
                            : booking.isPaymentStepOpen
                              ? booking.paymentMethod === "pix"
                                ? "Pix direto com vencimento de 10 minutos"
                                : "Checkout seguro do Mercado Pago"
                              : "E-mail ja validado para esta reserva"}
                        </small>
                      </div>
                    </div>
                    {booking.isEmailVerificationStepOpen ? (
                      <EmailVerificationStep
                        canResendEmailCode={booking.canResendEmailCode}
                        emailCodeCountdown={booking.emailCodeCountdown}
                        emailCodeExpired={booking.emailCodeExpired}
                        emailFeedback={booking.emailFeedback}
                        emailResendCountdown={booking.emailResendCountdown}
                        emailVerification={booking.emailVerification}
                        emailVerificationInfo={booking.emailVerificationInfo}
                        isEmailConfirming={booking.isEmailConfirming}
                        isEmailSending={booking.isEmailSending}
                        isEmailSessionLoading={booking.isEmailSessionLoading}
                        onChange={booking.handleEmailVerificationChange}
                        onConfirmCode={booking.handleConfirmEmailCode}
                        onSendCode={booking.handleSendEmailCode}
                      />
                    ) : booking.isPaymentStepOpen ? (
                      <PaymentStep
                        checkoutCountdown={booking.checkoutCountdown}
                        checkoutExpired={booking.checkoutExpired}
                        checkoutInfo={booking.checkoutInfo}
                        customer={booking.customer}
                        dataFormatada={booking.dataFormatada}
                        onCopyPixCode={booking.handleCopyPixCode}
                        onPaymentMethodChange={booking.handlePaymentMethodChange}
                        paymentMethod={booking.paymentMethod}
                        pixCopyFeedback={booking.pixCopyFeedback}
                        selectedCourtData={booking.selectedCourtData}
                        selectedHorario={booking.selectedHorario}
                        selectedModality={booking.selectedModality}
                        valorFormatado={booking.valorFormatado}
                      />
                    ) : (
                      <CustomerDataStep
                        customer={booking.customer}
                        onChange={booking.handleCustomerChange}
                        onChangeVerifiedEmail={booking.handleChangeVerifiedEmail}
                      />
                    )}
                  </div>
                )}

                {booking.error && (
                  <p className="form-error" role="alert">
                    {booking.error}
                  </p>
                )}

                {booking.showCustomerDataStep && booking.verifiedEmail && (
                  <BookingSubmitActions
                    checkoutInfo={booking.checkoutInfo}
                    isPaymentStepOpen={booking.isPaymentStepOpen}
                    isSubmitting={booking.isSubmitting}
                    onBackToCustomerData={booking.handleBackToCustomerData}
                    paymentMethod={booking.paymentMethod}
                  />
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default BookingFlowPage;
