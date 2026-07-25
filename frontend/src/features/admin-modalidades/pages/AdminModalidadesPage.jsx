import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import StatusBadge from "../../../components/admin/StatusBadge";
import { alterarStatusModalidade, listarModalidades } from "../../../services/modalidadeService";
import { MODALIDADE_STATUS, labelModalidadeStatus } from "../../../shared/constants/adminStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import { Panel } from "../../admin-shared/components/Panel";
import { ResponsiveTable } from "../../admin-shared/components/ResponsiveTable";
import { normalizarBusca } from "../../admin-shared/utils/adminFormatters";

export default function AdminModalidadesPage() {
  return (
    <AdminPageShell route="modalidades">
      {({ searchQuery }) => <ModalitiesScreen searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function ModalitiesScreen({ searchQuery = "" }) {
  const [modalidades, setModalidades] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarModalidades = async () => {
    setIsLoading(true);
    setError("");
    try {
      setModalidades(await listarModalidades());
    } catch {
      setError("Não foi possível carregar as modalidades.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarModalidades);
  }, []);

  const mudarStatus = async (id, status) => {
    setFeedback("");
    setError("");
    try {
      await alterarStatusModalidade(id, status);
      setFeedback("Status da modalidade atualizado.");
      await carregarModalidades();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar a modalidade.");
    }
  };

  const modalidadesFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return modalidades;

    return modalidades.filter((modalidade) => {
      const valores = [
        modalidade.nome,
        modalidade.descricao,
        labelModalidadeStatus(modalidade.status),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [modalidades, searchQuery]);

  return (
    <div className="admin-page">
      <Panel title="Modalidades">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!modalidadesFiltradas.length}
          loadingText="Carregando modalidades..."
          emptyText={searchQuery ? "Nenhuma modalidade encontrada para essa busca." : "Nenhuma modalidade encontrada."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && modalidadesFiltradas.length > 0 && (
          <ResponsiveTable columns={["Nome", "Descricao", "Status", "Acoes"]}>
            {modalidadesFiltradas.map((modalidade) => (
              <tr key={modalidade.id}>
                <td>
                  <strong>{modalidade.nome}</strong>
                  <small>MOD-{modalidade.id}</small>
                </td>
                <td>{modalidade.descricao || "--"}</td>
                <td>
                  <StatusBadge status={labelModalidadeStatus(modalidade.status)} />
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button type="button" onClick={() => mudarStatus(modalidade.id, MODALIDADE_STATUS.ATIVA)}>
                      <Check aria-hidden="true" size={15} />
                      <span>Ativar</span>
                    </button>
                    <button type="button" onClick={() => mudarStatus(modalidade.id, MODALIDADE_STATUS.INATIVA)}>
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
