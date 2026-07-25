import { CalendarDays, ChevronRight, ClipboardList, TimerReset } from "lucide-react";

const iconMap = {
  reservations: CalendarDays,
  occupancy: TimerReset,
  pending: ClipboardList,
};

export default function QuickSummary({ items = [], onNavigate }) {
  return (
    <section className="admin-panel admin-quick-summary">
      <header className="admin-panel-heading">
        <div>
          <span className="admin-panel-heading__icon">
            <ClipboardList aria-hidden="true" size={19} />
          </span>
          <h2>Resumo rápido</h2>
        </div>
      </header>

      <div className="admin-quick-summary__list">
        {items.map((item) => {
          const Icon = iconMap[item.icon] || ClipboardList;
          const clickable = Boolean(item.route && onNavigate);

          return (
            <button
              key={item.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onNavigate(item.route)}
            >
              <span className={`admin-quick-summary__icon admin-quick-summary__icon--${item.icon}`}>
                <Icon aria-hidden="true" size={18} />
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              {clickable && <ChevronRight aria-hidden="true" size={18} />}
            </button>
          );
        })}
      </div>
    </section>
  );
}
