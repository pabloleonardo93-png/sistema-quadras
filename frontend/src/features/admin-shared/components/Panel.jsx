export function Panel({ action, children, className = "", onAction, title }) {
  return (
    <section className={`admin-panel${className ? ` ${className}` : ""}`}>
      <header>
        <h2>{title}</h2>
        {action && onAction && (
          <button type="button" onClick={onAction}>
            {action}
          </button>
        )}
        {action && !onAction && <span className="admin-panel__badge">{action}</span>}
      </header>
      {children}
    </section>
  );
}
