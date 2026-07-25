import CourtScheduleCard from "./CourtScheduleCard";
import EmptyState from "./EmptyState";

export default function ScheduleGrid({
  formatTime,
  groups,
  onCourtDetails,
  onSlotAction,
  savingSlotId,
  statusClass,
  statusLabel,
}) {
  if (!groups.length) {
    return (
      <EmptyState
        title="Nenhum horário encontrado"
        description="Ajuste data, quadra, modalidade ou status para visualizar disponibilidade."
      />
    );
  }

  return (
    <div className="admin-schedule-grid">
      {groups.map((group) => (
        <CourtScheduleCard
          formatTime={formatTime}
          group={group}
          key={group.key}
          onCourtDetails={onCourtDetails}
          onSlotAction={onSlotAction}
          savingSlotId={savingSlotId}
          statusClass={statusClass}
          statusLabel={statusLabel}
        />
      ))}
    </div>
  );
}
