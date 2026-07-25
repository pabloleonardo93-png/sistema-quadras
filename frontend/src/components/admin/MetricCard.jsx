export default function MetricCard({ detail, icon: Icon, label, tone = "blue", value }) {
  return (
    <article className={`admin-metric-card admin-metric-card--${tone}`}>
      <span className="admin-metric-card__icon">
        <Icon aria-hidden="true" size={22} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  );
}
