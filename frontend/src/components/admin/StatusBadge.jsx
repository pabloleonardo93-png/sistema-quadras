import { normalizeStatusClass } from "../../shared/formatters/statusClass";

export default function StatusBadge({ status }) {
  const label = status || "--";
  return <span className={`admin-status admin-status--${normalizeStatusClass(label)}`}>{label}</span>;
}
