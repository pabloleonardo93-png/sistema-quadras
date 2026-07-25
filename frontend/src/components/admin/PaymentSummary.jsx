import { AlertTriangle, CheckCircle2, CreditCard } from "lucide-react";

export default function PaymentSummary({
  approvedPaymentsLabel,
  monthlyRevenueLabel,
  onOpenReservations,
  pendingCount = 0,
}) {
  const hasPending = pendingCount > 0;

  return (
    <section className="admin-panel admin-payment-summary">
      <header className="admin-panel-heading">
        <div>
          <span className="admin-panel-heading__icon">
            <CreditCard aria-hidden="true" size={19} />
          </span>
          <h2>Pagamentos (Mercado Pago)</h2>
        </div>
      </header>

      <div className={`admin-payment-card ${hasPending ? "admin-payment-card--warning" : "admin-payment-card--ok"}`}>
        <span className="admin-payment-card__icon">
          {hasPending ? <AlertTriangle aria-hidden="true" size={28} /> : <CheckCircle2 aria-hidden="true" size={31} />}
        </span>
        <div>
          <strong>{hasPending ? `${pendingCount} pendência${pendingCount > 1 ? "s" : ""}` : "Tudo em dia"}</strong>
          <p>{hasPending ? "Há reservas aguardando confirmação de pagamento." : "Não há pendências de pagamento"}</p>
        </div>
      </div>

      <div className="admin-payment-summary__metrics">
        <div>
          <span>Recebido no mês</span>
          <strong>{monthlyRevenueLabel}</strong>
        </div>
        <div>
          <span>Pagamentos aprovados</span>
          <strong>{approvedPaymentsLabel}</strong>
        </div>
      </div>

      {hasPending && (
        <button className="admin-payment-summary__action" type="button" onClick={onOpenReservations}>
          Abrir reservas relacionadas
        </button>
      )}
    </section>
  );
}
