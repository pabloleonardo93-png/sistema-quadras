import { RotateCcw } from "lucide-react";

export default function FilterBar({ children, onClear }) {
  return (
    <section className="admin-filter-bar" aria-label="Filtros">
      <div className="admin-filter-bar__fields">{children}</div>
      {onClear && (
        <button className="admin-filter-bar__clear" type="button" onClick={onClear}>
          <RotateCcw aria-hidden="true" size={16} />
          <span>Limpar filtros</span>
        </button>
      )}
    </section>
  );
}

export function FilterField({ children, label }) {
  return (
    <label className="admin-filter-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
