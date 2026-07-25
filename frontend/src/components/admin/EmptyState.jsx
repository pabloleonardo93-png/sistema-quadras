import { Inbox } from "lucide-react";

export default function EmptyState({
  action,
  description,
  icon: Icon = Inbox,
  onAction,
  title = "Nenhum registro encontrado",
}) {
  return (
    <div className="admin-empty-state">
      <span>
        <Icon aria-hidden="true" size={22} />
      </span>
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action && onAction && (
        <button type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}
