export function Sparkline({ tone = "blue", values = [] }) {
  const cleanValues = values.map((value) => Number(value) || 0);
  const max = Math.max(1, ...cleanValues);
  const points = cleanValues.length > 1
    ? cleanValues.map((value, index) => {
      const x = (index / (cleanValues.length - 1)) * 100;
      const y = 34 - ((value / max) * 28);
      return `${x},${y}`;
    }).join(" ")
    : "0,25 100,25";

  return (
    <svg className={`admin-insight-sparkline admin-insight-sparkline--${tone}`} viewBox="0 0 100 40" role="img" aria-label="Tendência do indicador">
      <polyline points={points} fill="none" pathLength="1" vectorEffect="non-scaling-stroke" />
      <circle cx="100" cy={cleanValues.length > 1 ? 34 - ((cleanValues.at(-1) / max) * 28) : 25} r="2.3" />
    </svg>
  );
}

export function EmptyChart({ text = "Sem dados para este recorte." }) {
  return <p className="admin-insight-empty">{text}</p>;
}

export function StatusBadge({ label, tone = "neutral" }) {
  return <span className={`admin-insight-status admin-insight-status--${tone}`}>{label}</span>;
}

export function MetricCard({ detail, icon: Icon, label, sparkline, tone = "blue", value }) {
  return (
    <article className={`admin-insight-metric admin-insight-metric--${tone}`}>
      <div className="admin-insight-metric__top">
        <span className="admin-insight-metric__icon"><Icon aria-hidden="true" size={18} /></span>
        <Sparkline tone={tone} values={sparkline} />
      </div>
      <span className="admin-insight-metric__label">{label}</span>
      <strong title={String(value)}>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function DashboardSkeleton({ metrics = 4 }) {
  return (
    <div className="admin-insight-skeleton" aria-label="Carregando indicadores" aria-busy="true">
      {Array.from({ length: metrics }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function StatusDonut({ items = [], total = 0 }) {
  const visibleItems = items.filter((item) => item.value > 0);
  const segments = visibleItems.reduce((result, item) => {
    const start = result.offset;
    const nextOffset = start + ((item.value / Math.max(1, total)) * 100);
    return {
      offset: nextOffset,
      values: [...result.values, `${item.color} ${start}% ${nextOffset}%`],
    };
  }, { offset: 0, values: [] }).values;

  if (!segments.length) return <EmptyChart />;

  return (
    <div className="admin-insight-donut-layout">
      <div className="admin-insight-donut" style={{ background: `conic-gradient(${segments.join(", ")})` }}>
        <div><strong>{total}</strong><span>reservas</span></div>
      </div>
      <ul className="admin-insight-donut-legend">
        {items.map((item) => (
          <li key={item.label} title={`${item.label}: ${item.value}`}>
            <i style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VerticalBarChart({ averages = [], items = [] }) {
  const max = Math.max(1, ...items.map((item) => item.value), ...averages);
  if (!items.length) return <EmptyChart />;

  const points = averages.length === items.length && items.length > 1
    ? averages.map((value, index) => {
      const x = 10 + ((index / (items.length - 1)) * 280);
      return `${x},${122 - ((value / max) * 92)}`;
    }).join(" ")
    : "";

  return (
    <div className="admin-insight-bar-chart">
      <svg viewBox="0 0 300 145" role="img" aria-label="Evolução das reservas">
        {items.map((item, index) => {
          const width = 220 / Math.max(items.length, 1);
          const x = 22 + (index * (250 / items.length));
          const height = (item.value / max) * 92;
          return (
            <g key={item.label}>
              <title>{`${item.label}: ${item.value} reserva${item.value === 1 ? "" : "s"}`}</title>
              <rect x={x} y={122 - height} width={Math.max(7, width)} height={height} rx="2" />
              <text x={x + (Math.max(7, width) / 2)} y="140" textAnchor="middle">{item.label}</text>
            </g>
          );
        })}
        {points && <polyline className="admin-insight-bar-chart__average" points={points} fill="none" />}
      </svg>
      <div className="admin-insight-chart-key"><i /> Reservas {points && <><b /> Média móvel</>}</div>
    </div>
  );
}
