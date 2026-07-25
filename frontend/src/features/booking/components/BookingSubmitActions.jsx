import { ChevronLeft, MailCheck } from "lucide-react";
import { Button } from "../../../components/Button";

export function BookingSubmitActions({
  checkoutInfo,
  isPaymentStepOpen,
  isSubmitting,
  onBackToCustomerData,
  paymentMethod,
}) {
  return (
    <div className="form-submit">
      {isPaymentStepOpen ? (
        <button
          className="form-submit__back"
          type="button"
          onClick={onBackToCustomerData}
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
  );
}
