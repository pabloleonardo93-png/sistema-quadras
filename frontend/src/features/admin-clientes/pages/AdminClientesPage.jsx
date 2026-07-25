import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import StatusBadge from "../../../components/admin/StatusBadge";
import { alterarStatusCliente, listarClientes } from "../../../services/clienteService";
import { CLIENTE_STATUS, labelClienteStatus } from "../../../shared/constants/adminStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import { Panel } from "../../admin-shared/components/Panel";
import { ResponsiveTable } from "../../admin-shared/components/ResponsiveTable";
import { normalizarBusca } from "../../admin-shared/utils/adminFormatters";

export default function AdminClientesPage() {
  return (
    <AdminPageShell route="clientes">
      {({ searchQuery }) => <ClientsScreen searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function ClientsScreen({ searchQuery = "" }) {
  const [clientes, setClientes] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarClientes = async () => {
    setIsLoading(true);
    setError("");
    try {
      setClientes(await listarClientes());
    } catch {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarClientes);
  }, []);

  const mudarStatus = async (id, status) => {
    setFeedback("");
    setError("");
    try {
      await alterarStatusCliente(id, status);
      setFeedback("Status do cliente atualizado.");
      await carregarClientes();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o cliente.");
    }
  };

  const clientesFiltrados = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return clientes;

    return clientes.filter((client) => {
      const valores = [
        client.nome,
        client.telefone,
        client.email,
        labelClienteStatus(client.status),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [clientes, searchQuery]);

  return (
    <div className="admin-page">
      <Panel title="Base de clientes">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!clientesFiltrados.length}
          loadingText="Carregando clientes..."
          emptyText={searchQuery ? "Nenhum cliente encontrado para essa busca." : "Nenhum cliente encontrado."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && clientesFiltrados.length > 0 && (
          <ResponsiveTable columns={["Nome", "Telefone", "E-mail", "Status", "Acoes"]}>
            {clientesFiltrados.map((client) => (
              <tr key={client.id}>
                <td>
                  <strong>{client.nome}</strong>
                  <small>CL-{client.id}</small>
                </td>
                <td>{client.telefone}</td>
                <td>{client.email}</td>
                <td>
                  <StatusBadge status={labelClienteStatus(client.status)} />
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button type="button" onClick={() => mudarStatus(client.id, CLIENTE_STATUS.ATIVO)}>
                      <Check aria-hidden="true" size={15} />
                      <span>Ativar</span>
                    </button>
                    <button type="button" onClick={() => mudarStatus(client.id, CLIENTE_STATUS.INATIVO)}>
                      <X aria-hidden="true" size={15} />
                      <span>Inativar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        )}
      </Panel>
    </div>
  );
}
