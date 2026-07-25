export default function ConversionFunnel({ steps = [] }) {
  const first = Math.max(1, Number(steps[0]?.value || 0));

  return (
    <div className="admin-conversion-funnel">
      {steps.map((step, index) => {
        const percent = Math.round((Number(step.value || 0) / first) * 100);
        const previous = index > 0 ? Number(steps[index - 1]?.value || 0) : null;
        const drop = previous ? Math.max(0, previous - Number(step.value || 0)) : 0;
        const dropPercent = previous ? Math.round((drop / previous) * 100) : null;

        return (
          <div key={step.id}>
            <span>{step.label}</span>
            <strong>{step.value}</strong>
            <em>{percent}%</em>
            <i>
              <b style={{ width: `${Math.min(percent, 100)}%` }} />
            </i>
            <small>{dropPercent === null ? "-" : `${dropPercent}% abandono`}</small>
          </div>
        );
      })}
    </div>
  );
}
