import { RefreshCw } from "lucide-react";
import EmptyState from "./EmptyState";

export default function ReportChartCard({ children, empty, emptyText, title }) {
  return (
    <section className="admin-report-chart-card">
      <header>
        <h3>{title}</h3>
      </header>
      {empty ? (
        <EmptyState title="Sem dados para exibir" description={emptyText || "Altere o período ou filtros para ampliar a análise."} />
      ) : (
        children
      )}
      <footer>
        <span>Atualizado agora há pouco</span>
        <RefreshCw aria-hidden="true" size={13} />
      </footer>
    </section>
  );
}
