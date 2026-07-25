import { Clock3, Copy, CreditCard, ExternalLink, QrCode, ShieldCheck } from "lucide-react";

export function PaymentStep({
  checkoutCountdown,
  checkoutExpired,
  checkoutInfo,
  customer,
  dataFormatada,
  onCopyPixCode,
  onPaymentMethodChange,
  paymentMethod,
  pixCopyFeedback,
  selectedCourtData,
  selectedHorario,
  selectedModality,
  valorFormatado,
}) {
  return (
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
          onClick={() => onPaymentMethodChange("pix")}
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
          onClick={() => onPaymentMethodChange("card")}
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
                <button type="button" onClick={onCopyPixCode}>
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
  );
}
