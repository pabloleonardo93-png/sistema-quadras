export default function AdminPageHeader({ actions, children, eyebrow, subtitle, title }) {
  return (
    <section className="admin-page-header">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="admin-page-header__actions">{actions}</div>}
      {children}
    </section>
  );
}
