import { Clock3 } from "lucide-react";

export default function OccupancyChart({ data = [] }) {
  if (!data.length) return null;

  return (
    <section className="admin-panel admin-occupancy-chart">
      <header className="admin-panel-heading">
        <div>
          <span className="admin-panel-heading__icon">
            <Clock3 aria-hidden="true" size={19} />
          </span>
          <h2>Ocupação por horário - Hoje</h2>
        </div>
      </header>

      <div className="admin-occupancy-chart__bars" aria-label="Ocupação por horário">
        {data.map((item) => (
          <div className="admin-occupancy-chart__bar" key={item.hour}>
            <strong>{item.percent}%</strong>
            <span>
              <i style={{ height: `${Math.max(item.percent, 4)}%` }} />
            </span>
            <small>{item.hour}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
