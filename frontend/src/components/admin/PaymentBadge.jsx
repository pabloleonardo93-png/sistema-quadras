import { normalizeStatusClass } from "../../shared/formatters/statusClass";

export default function PaymentBadge({ status }) {
  const label = status || "Não pago";
  return <span className={`admin-payment-badge admin-payment-badge--${normalizeStatusClass(label, "nao_pago")}`}>{label}</span>;
}
