import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Filter, Plus, Search, X } from "lucide-react";
import StatusBadge from "../../../components/admin/StatusBadge";
import { getCourtImage } from "../../../constants/courtImages";
import { listarModalidades } from "../../../services/modalidadeService";
import { alterarStatusQuadra, atualizarQuadra, criarQuadra, listarQuadrasAdmin } from "../../../services/quadraService";
import { QUADRA_STATUS, labelQuadraStatus } from "../../../shared/constants/adminStatus";
import AdminPageShell from "../../admin-shared/components/AdminPageShell";
import { AdminState } from "../../admin-shared/components/AdminState";
import { normalizarBusca } from "../../admin-shared/utils/adminFormatters";

export default function AdminQuadrasPage() {
  return (
    <AdminPageShell route="quadras">
      {({ searchQuery }) => <CourtsScreen searchQuery={searchQuery} />}
    </AdminPageShell>
  );
}

function formatarValorQuadra(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

function normalizarValorQuadra(valor) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const numero = Number(texto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numero) && numero >= 0 ? numero : null;
}

function dadosQuadraParaAtualizacao(quadra, valorHora) {
  return {
    nome: quadra.nome,
    descricao: quadra.descricao || "",
    valorHora,
    imagemUrl: quadra.imagemUrl || "",
    modalidadesIds: (quadra.modalidades || []).map((modalidade) => modalidade.id),
  };
}

const cadastroQuadraInicial = {
  nome: "",
  descricao: "",
  valorHora: "",
  imagemUrl: "",
  modalidadesIds: [],
};

function CourtsScreen({ searchQuery = "" }) {
  const [courts, setCourts] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [savingPriceId, setSavingPriceId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [courtForm, setCourtForm] = useState(cadastroQuadraInicial);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const carregarQuadras = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [quadrasResult, modalidadesResult] = await Promise.allSettled([
        listarQuadrasAdmin(),
        listarModalidades(),
      ]);
      if (quadrasResult.status === "rejected") throw quadrasResult.reason;
      const quadras = quadrasResult.value;
      const modalidadesCarregadas = modalidadesResult.status === "fulfilled" ? modalidadesResult.value : [];
      setCourts(quadras);
      setModalidades(modalidadesCarregadas);
      setPriceDrafts(
        Object.fromEntries(quadras.map((quadra) => [quadra.id, formatarValorQuadra(quadra.valorHora)])),
      );
    } catch {
      setError("Não foi possível carregar as quadras.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(carregarQuadras);
  }, []);

  const mudarStatus = async (id, status) => {
    setFeedback("");
    setError("");
    try {
      await alterarStatusQuadra(id, status);
      setCourts((atuais) => atuais.map((court) => (court.id === id ? { ...court, status } : court)));
      setFeedback("Status da quadra atualizado.");
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar a quadra.");
    }
  };

  const atualizarRascunhoValor = (id, valor) => {
    setPriceDrafts((atual) => ({ ...atual, [id]: valor }));
  };

  const salvarValor = async (event, court) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    const valorHora = normalizarValorQuadra(priceDrafts[court.id]);
    if (valorHora === null) {
      setError("Informe um valor válido para a quadra.");
      return;
    }

    if (!court.modalidades?.length) {
      setError("A quadra precisa ter modalidades vinculadas para atualizar o valor.");
      return;
    }

    setSavingPriceId(court.id);
    try {
      await atualizarQuadra(court.id, dadosQuadraParaAtualizacao(court, valorHora));
      setFeedback(`Valor da ${court.nome} atualizado.`);
      await carregarQuadras();
    } catch (requestError) {
      setError(requestError.message || "Não foi possível atualizar o valor da quadra.");
    } finally {
      setSavingPriceId(null);
    }
  };

  const abrirCadastroQuadra = () => {
    setCreateError("");
    setCourtForm({
      ...cadastroQuadraInicial,
      modalidadesIds: modalidades.map((modalidade) => modalidade.id),
    });
    setIsCreateOpen(true);
  };

  const fecharCadastroQuadra = () => {
    if (isCreating) return;
    setIsCreateOpen(false);
    setCreateError("");
  };

  const atualizarCampoCadastro = (campo, valor) => {
    setCourtForm((atual) => ({ ...atual, [campo]: valor }));
  };

  const alternarModalidadeCadastro = (id) => {
    setCourtForm((atual) => {
      const selecionadas = atual.modalidadesIds.includes(id)
        ? atual.modalidadesIds.filter((modalidadeId) => modalidadeId !== id)
        : [...atual.modalidadesIds, id];
      return { ...atual, modalidadesIds: selecionadas };
    });
  };

  const salvarCadastroQuadra = async (event) => {
    event.preventDefault();
    setCreateError("");
    setFeedback("");
    setError("");

    const valorHora = normalizarValorQuadra(courtForm.valorHora);
    if (!courtForm.nome.trim()) {
      setCreateError("Informe o nome da quadra.");
      return;
    }
    if (valorHora === null) {
      setCreateError("Informe um valor valido para a quadra.");
      return;
    }
    if (!courtForm.modalidadesIds.length) {
      setCreateError("Selecione ao menos uma modalidade.");
      return;
    }

    setIsCreating(true);
    try {
      await criarQuadra({
        nome: courtForm.nome.trim(),
        descricao: courtForm.descricao.trim(),
        valorHora,
        imagemUrl: courtForm.imagemUrl.trim(),
        modalidadesIds: courtForm.modalidadesIds,
      });
      setFeedback("Quadra criada com sucesso.");
      setIsCreateOpen(false);
      setCourtForm(cadastroQuadraInicial);
      await carregarQuadras();
    } catch (requestError) {
      setCreateError(requestError.message || "Nao foi possivel cadastrar a quadra.");
    } finally {
      setIsCreating(false);
    }
  };

  const courtsFiltradas = useMemo(() => {
    const termo = normalizarBusca(searchQuery);
    if (!termo) return courts;

    return courts.filter((court) => {
      const valores = [
        court.nome,
        court.descricao,
        labelQuadraStatus(court.status),
        formatarValorQuadra(court.valorHora),
        ...(court.modalidades || []).map((modalidade) => modalidade.nome),
      ];
      return valores.some((valor) => normalizarBusca(valor).includes(termo));
    });
  }, [courts, searchQuery]);

  return (
    <div className="admin-page">
      <Toolbar title="Quadras" buttonLabel="Cadastrar nova quadra" onButtonClick={abrirCadastroQuadra} />
      <AdminState
        error={error}
        isLoading={isLoading}
        empty={!courtsFiltradas.length}
        loadingText="Carregando quadras..."
        emptyText={searchQuery ? "Nenhuma quadra encontrada para essa busca." : "Nenhuma quadra encontrada."}
      />
      {feedback && <p className="admin-success">{feedback}</p>}
      {!isLoading && !error && courtsFiltradas.length > 0 && (
        <section className="admin-court-grid">
          {courtsFiltradas.map((court, index) => (
            <article className="admin-court-card" key={court.id}>
              <img src={getCourtImage(court, index)} alt={`Foto da ${court.nome}`} />
              <div>
                <span>C-{String(court.id).padStart(2, "0")}</span>
                <StatusBadge status={labelQuadraStatus(court.status)} />
              </div>
              <h2>{court.nome}</h2>
              <p>{(court.modalidades || []).map((modalidade) => modalidade.nome).join(" | ") || court.descricao || "--"}</p>
              <footer>
                <small>{court.descricao || "Sem descricao"}</small>
              </footer>
              {court.status === QUADRA_STATUS.MANUTENCAO && (
                <div className="admin-court-card__notice">
                  <AlertTriangle aria-hidden="true" size={17} />
                  <span>
                    <strong>Em manutenção</strong>
                    <small>Oculta para clientes até ser ativada novamente.</small>
                  </span>
                </div>
              )}
              <form className="admin-court-card__price-form" onSubmit={(event) => salvarValor(event, court)}>
                <label htmlFor={`court-price-${court.id}`}>Valor por hora</label>
                <div className="admin-court-card__price-field">
                  <span>R$</span>
                  <input
                    id={`court-price-${court.id}`}
                    inputMode="decimal"
                    value={priceDrafts[court.id] ?? formatarValorQuadra(court.valorHora)}
                    onChange={(event) => atualizarRascunhoValor(court.id, event.target.value)}
                  />
                </div>
                <AdminButton type="submit" variant="ghost" disabled={savingPriceId === court.id}>
                  {savingPriceId === court.id ? "Salvando..." : "Salvar valor"}
                </AdminButton>
              </form>
              <div className="admin-card-actions">
                <AdminButton variant="ghost" disabled={court.status === QUADRA_STATUS.ATIVA} onClick={() => mudarStatus(court.id, QUADRA_STATUS.ATIVA)}>
                  Ativar
                </AdminButton>
                <AdminButton
                  variant="ghost"
                  disabled={court.status === QUADRA_STATUS.MANUTENCAO}
                  onClick={() => mudarStatus(court.id, QUADRA_STATUS.MANUTENCAO)}
                >
                  Manutenção
                </AdminButton>
                <AdminButton disabled={court.status === QUADRA_STATUS.INATIVA} onClick={() => mudarStatus(court.id, QUADRA_STATUS.INATIVA)}>
                  Inativar
                </AdminButton>
              </div>
            </article>
          ))}
        </section>
      )}
      {isCreateOpen && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={fecharCadastroQuadra}>
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-create-court-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Nova quadra</span>
                <h2 id="admin-create-court-title">Cadastrar quadra</h2>
              </div>
              <button type="button" aria-label="Fechar cadastro" onClick={fecharCadastroQuadra}>
                <X aria-hidden="true" size={20} />
              </button>
            </header>
            <form className="admin-form admin-form--court-create" onSubmit={salvarCadastroQuadra}>
              <label>
                Nome
                <input
                  value={courtForm.nome}
                  onChange={(event) => atualizarCampoCadastro("nome", event.target.value)}
                  placeholder="Areia 04"
                  required
                />
              </label>
              <label>
                Valor por hora
                <input
                  inputMode="decimal"
                  value={courtForm.valorHora}
                  onChange={(event) => atualizarCampoCadastro("valorHora", event.target.value)}
                  placeholder="90,00"
                  required
                />
              </label>
              <label className="admin-form__wide">
                URL da imagem
                <input
                  value={courtForm.imagemUrl}
                  onChange={(event) => atualizarCampoCadastro("imagemUrl", event.target.value)}
                  placeholder="/images/quadras/areia-01.jpeg"
                />
              </label>
              <label className="admin-form__wide">
                Descricao
                <textarea
                  value={courtForm.descricao}
                  onChange={(event) => atualizarCampoCadastro("descricao", event.target.value)}
                  placeholder="Quadra coberta com areia nivelada e iluminacao profissional."
                />
              </label>
              <fieldset className="admin-form__wide admin-fieldset">
                <legend>Modalidades</legend>
                <div>
                  {modalidades.map((modalidade) => (
                    <label className="admin-check" key={modalidade.id}>
                      <input
                        type="checkbox"
                        checked={courtForm.modalidadesIds.includes(modalidade.id)}
                        onChange={() => alternarModalidadeCadastro(modalidade.id)}
                      />
                      {modalidade.nome}
                    </label>
                  ))}
                </div>
              </fieldset>
              {createError && <p className="admin-error admin-form__wide">{createError}</p>}
              <div className="admin-modal__actions admin-form__wide">
                <AdminButton type="button" variant="ghost" onClick={fecharCadastroQuadra} disabled={isCreating}>
                  Cancelar
                </AdminButton>
                <AdminButton type="submit" disabled={isCreating}>
                  {isCreating ? "Cadastrando..." : "Cadastrar quadra"}
                </AdminButton>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function Toolbar({ buttonLabel, onButtonClick, showFilter = false, showSearch = false, title }) {
  const hasActions = showSearch || showFilter || (buttonLabel && onButtonClick);

  return (
    <div className="admin-toolbar">
      <div>
        <h2>{title}</h2>
        <p>Informações atualizadas quando o sistema estiver disponível.</p>
      </div>
      {hasActions && (
        <div>
          {showSearch && <SearchInput placeholder="Pesquisar" />}
          {showFilter && (
            <button className="admin-filter" type="button">
              <Filter aria-hidden="true" size={17} />
              Filtros
            </button>
          )}
          {buttonLabel && onButtonClick && (
            <AdminButton onClick={onButtonClick}>
              <Plus aria-hidden="true" size={17} />
              {buttonLabel}
            </AdminButton>
          )}
        </div>
      )}
    </div>
  );
}

function SearchInput({ onChange, placeholder, value }) {
  return (
    <label className="admin-search">
      <Search aria-hidden="true" size={17} />
      <input
        type="search"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}

function AdminButton({ children, variant = "primary", ...props }) {
  return (
    <button className={`admin-button admin-button--${variant}`} type="button" {...props}>
      {children}
    </button>
  );
}
