export function ResponsiveTable({ children, className = "", columns }) {
  return (
    <div className="admin-table-wrap">
      <table className={`admin-table${className ? ` ${className}` : ""}`}>
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
