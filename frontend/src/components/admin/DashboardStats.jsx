export default function DashboardStats({ stats = [] }) {
  return (
    <section className="admin-dashboard-stats" aria-label="Indicadores do dashboard">
      {stats.map(({ icon: Icon, id, secondary, title, tone = "blue", value }) => (
        <article className={`admin-dashboard-stat admin-dashboard-stat--${tone}`} key={id}>
          <span className="admin-dashboard-stat__icon">
            <Icon aria-hidden="true" size={25} />
          </span>
          <div>
            <p>{title}</p>
            <strong>{value}</strong>
            <small>{secondary}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
