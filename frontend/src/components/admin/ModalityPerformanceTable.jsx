import DataTable from "./DataTable";

export default function ModalityPerformanceTable({ rows = [] }) {
  return (
    <DataTable
      columns={["Modalidade", "Reservas", "Confirmadas", "Canceladas", "Expiradas", "Conversão", "Receita"]}
      minWidth={760}
    >
      {rows.map((row) => (
        <tr key={row.name}>
          <td>
            <strong>{row.name}</strong>
          </td>
          <td>{row.total}</td>
          <td>{row.confirmed}</td>
          <td>{row.canceled}</td>
          <td>{row.expired}</td>
          <td>
            <span className="admin-conversion-pill">{row.conversion}</span>
          </td>
          <td>{row.revenue}</td>
        </tr>
      ))}
    </DataTable>
  );
}
