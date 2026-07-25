export function AdminState({ error, isLoading, empty, loadingText, emptyText }) {
  if (isLoading) return <p className="admin-muted">{loadingText}</p>;
  if (error) return <p className="admin-error">{error}</p>;
  if (empty) return <p className="admin-muted">{emptyText}</p>;
  return null;
}
