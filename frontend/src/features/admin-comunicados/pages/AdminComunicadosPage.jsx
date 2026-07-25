import { useEffect, useMemo, useState } from "react";
import { Archive, Check } from "lucide-react";
import StatusBadge from "../../../components/admin/StatusBadge";
import { arquivarComunicado, listarComunicados, publicarComunicado } from "../../../services/comunicadoService";
import { labelComunicadoStatus } from "../../../shared/constants/adminStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import { Panel } from "../../admin-shared/components/Panel";
import { normalizarBusca } from "../../admin-shared/utils/adminFormatters";

export default function AdminComunicadosPage() {
  return (
    <AdminPageShell route="comunicados">
      {({ searchQuery }) => <AnnouncementsScreen searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function AnnouncementsScreen({ searchQuery = "" }) {
  const [comunicados, setComunicados] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarComunicados = async () => {
    setIsLoading(true);
    setError("");
    try {
      setComunicados(await listarComunicados());
    } catch {
      setError("Não foi possível carregar os comunicados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarComunicados);
  }, []);

  const executarAcao = async (acao, id) => {
    setFeedback("");
    setError("");
    try {
      await acao(id);
      setFeedback("Comunicado atualizado com sucesso.");
      await carregarComunicados();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o comunicado.");
    }
  };

  const comunicadosFiltrados = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return comunicados;

    return comunicados.filter((announcement) => {
      const valores = [
        announcement.titulo,
        announcement.mensagem,
        labelComunicadoStatus(announcement.status),
        announcement.destaque ? "Destaque" : "",
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [comunicados, searchQuery]);

  return (
    <div className="admin-page admin-page--announcements">
      <Panel className="admin-panel--announcements" title="Comunicados">
        <AdminState
          error={error}
          isLoading={isLoading}
          empty={!comunicadosFiltrados.length}
          loadingText="Carregando comunicados..."
          emptyText={searchQuery ? "Nenhum comunicado encontrado para essa busca." : "Nenhum comunicado encontrado."}
        />
        {feedback && <p className="admin-success">{feedback}</p>}
        {!isLoading && !error && comunicadosFiltrados.length > 0 && (
          <div className="admin-announcements">
            {comunicadosFiltrados.map((announcement) => (
              <article key={announcement.id}>
                <div>
                  <StatusBadge status={labelComunicadoStatus(announcement.status)} />
                  {announcement.destaque && <span className="admin-highlight">Destaque</span>}
                </div>
                <h3>{announcement.titulo}</h3>
                <p>{announcement.mensagem}</p>
                <div className="admin-table-actions">
                  <button type="button" onClick={() => executarAcao(publicarComunicado, announcement.id)}>
                    <Check aria-hidden="true" size={15} />
                    <span>Publicar</span>
                  </button>
                  <button type="button" onClick={() => executarAcao(arquivarComunicado, announcement.id)}>
                    <Archive aria-hidden="true" size={15} />
                    <span>Arquivar</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
