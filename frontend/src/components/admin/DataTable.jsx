export default function DataTable({ children, columns, minWidth = 860 }) {
  return (
    <div className="admin-data-table-wrap">
      <table className="admin-data-table" style={{ minWidth }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
