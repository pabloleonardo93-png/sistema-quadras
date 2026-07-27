import { ArrowRight, BarChart3, CheckCircle2, Target } from "lucide-react";
import { EmptyChart, StatusDonut, VerticalBarChart } from "./AdminDataViz";

export function StatusReportCard({ items, total }) {
  return <section className="admin-insight-card admin-report-status"><header className="admin-insight-card__header"><div><BarChart3 aria-hidden="true" size={17} /><h2>Reservas por status</h2></div></header><StatusDonut items={items} total={total} /></section>;
}

export function ReservationsEvolutionCard({ averages, items }) {
  return <section className="admin-insight-card admin-report-evolution"><header className="admin-insight-card__header"><div><BarChart3 aria-hidden="true" size={17} /><h2>Evolução das reservas</h2></div></header><VerticalBarChart items={items} averages={averages} /></section>;
}

export function ConversionFunnel({ items = [] }) {
  const base = Math.max(1, items[0]?.value || 0);
  if (!items.length || !items.some((item) => item.value)) return <section className="admin-insight-card admin-report-funnel"><header className="admin-insight-card__header"><div><Target aria-hidden="true" size={17} /><h2>Funil de conversão</h2></div></header><EmptyChart text="Ainda não há acessos rastreados para montar o funil." /></section>;
  return <section className="admin-insight-card admin-report-funnel"><header className="admin-insight-card__header"><div><Target aria-hidden="true" size={17} /><h2>Funil de conversão</h2></div><small>Dados de acesso rastreados</small></header><div className="admin-report-funnel__rows">{items.map((item, index) => { const rate = Math.round((item.value / base) * 100); const previous = items[index - 1]?.value; const drop = previous ? Math.max(0, Math.round((1 - (item.value / previous)) * 100)) : null; return <div key={item.label}><div><span>{item.label}</span><strong>{item.value}</strong><em>{rate}%</em></div><i><b style={{ width: `${rate}%` }} /></i>{drop !== null && <small>{drop}% de abandono</small>}</div>; })}</div></section>;
}

export function ModalityPerformanceTable({ items = [], onNavigate }) {
  return <section className="admin-insight-card admin-report-modalities"><header className="admin-insight-card__header"><div><CheckCircle2 aria-hidden="true" size={17} /><h2>Desempenho por modalidade</h2></div></header>{items.length ? <div className="admin-report-modalities__table-wrap"><table><thead><tr><th>Modalidade</th><th>Reservas</th><th>Confirmadas</th><th>Canceladas</th><th>Conversão</th></tr></thead><tbody>{items.map((item) => <tr key={item.name}><td>{item.name}</td><td>{item.total}</td><td>{item.confirmed}</td><td>{item.cancelled}</td><td><span>{item.conversion}%</span></td></tr>)}</tbody></table></div> : <EmptyChart text="Não há reservas por modalidade neste recorte." />}<button className="admin-insight-card__footer-action" type="button" onClick={() => onNavigate?.("modalidades")}>Ver todas as modalidades <ArrowRight aria-hidden="true" size={14} /></button></section>;
}
