import { Check, Eye, MoreVertical, X } from "lucide-react";
import { useState } from "react";
import DataTable from "./DataTable";
import PaymentBadge from "./PaymentBadge";
import StatusBadge from "./StatusBadge";

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "--";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function ReservationTable({
  actionsForReservation,
  formatDate,
  formatTime,
  onAction,
  paymentLabel,
  reservations,
  savingAction,
  statusLabel,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  return (
    <DataTable
      columns={["Cliente", "Contato", "Quadra", "Modalidade", "Data", "Horário", "Status", "Pagamento", "Ações"]}
      minWidth={1040}
    >
      {reservations.map((reservation) => {
        const clientName = reservation.cliente?.nome || "--";
        const actions = actionsForReservation(reservation);
        const menuOpen = openMenu === reservation.id;

        return (
          <tr key={reservation.id}>
            <td>
              <div className="admin-reservation-client">
                <span>{initials(clientName)}</span>
                <strong>{clientName}</strong>
              </div>
            </td>
            <td>
              <span className="admin-table-main">{reservation.cliente?.telefone || reservation.cliente?.email || "--"}</span>
              {reservation.cliente?.telefone && reservation.cliente?.email && <small>{reservation.cliente.email}</small>}
            </td>
            <td>{reservation.quadra?.nome || "--"}</td>
            <td>{reservation.modalidade?.nome || "--"}</td>
            <td>{formatDate(reservation.data)}</td>
            <td>
              <span className="admin-time-chip">{formatTime(reservation.horaInicio)}</span>
            </td>
            <td>
              <StatusBadge status={statusLabel(reservation.status)} />
            </td>
            <td>
              <PaymentBadge status={paymentLabel(reservation.pagamentoStatus)} />
            </td>
            <td>
              <div className="admin-row-menu">
                <button
                  type="button"
                  aria-label={`Ações da reserva ${reservation.id}`}
                  disabled={!actions.length || Boolean(savingAction)}
                  aria-expanded={menuOpen}
                  onClick={() => setOpenMenu((current) => (current === reservation.id ? null : reservation.id))}
                >
                  <MoreVertical aria-hidden="true" size={18} />
                </button>
                {menuOpen && actions.length > 0 && (
                  <div className="admin-row-menu__panel">
                    {actions.map(({ acao, id, label, successMessage }) => {
                      const key = `${reservation.id}-${id}`;
                      const isSaving = savingAction === key;
                      const Icon = id === "confirmar" ? Check : id === "cancelar" ? X : Eye;

                      return (
                        <button
                          className={`admin-row-menu__action admin-row-menu__action--${id}`}
                          disabled={Boolean(savingAction)}
                          key={id}
                          type="button"
                          onClick={() => {
                            setOpenMenu(null);
                            onAction({ acao, id: reservation.id, key, successMessage });
                          }}
                        >
                          <Icon aria-hidden="true" size={15} />
                          <span>{isSaving ? "Salvando..." : label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
