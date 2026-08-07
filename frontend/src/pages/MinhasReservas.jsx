import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  LogOut,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { Footer } from "../components/Footer";
import { EmailVerificationAccess } from "../components/EmailVerificationAccess";
import { brand } from "../constants/brand";
import {
  buscarSessaoEmail,
  encerrarSessaoEmail,
} from "../services/emailVerificationService";
import {
  atualizarDadosMinhaReserva,
  buscarMinhaReserva,
  cancelarMinhaReserva,
  listarMinhasReservas,
} from "../services/reservaService";

const reservationStatus = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  expirada: "Expirada",
  finalizada: "Finalizada",
};

const paymentStatus = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
  estornado: "Estornado",
};

function formatDate(value) {
  if (!value) return "Data nao informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function formatRemaining(expiration, now) {
  if (!expiration) return "Sem prazo informado";
  const milliseconds = new Date(expiration).getTime() - now;
  if (milliseconds <= 0) return "Prazo encerrado";
  const seconds = Math.ceil(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function paymentMethodLabel(method) {
  if (method === "pix") return "Pix";
  if (method === "cartao") return "Cartao";
  return "Nao iniciada";
}

export default function MinhasReservas() {
  const [session, setSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editing, setEditing] = useState(false);
  const [customer, setCustomer] = useState({ nome: "", telefone: "" });
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const handleSessionExpired = (requestError) => {
    if ([401, 403].includes(requestError?.status)) {
      setSession(null);
      setReservations([]);
      setDetails(null);
      setSelectedId(null);
      return true;
    }
    return false;
  };

  const loadDetails = async (id) => {
    setDetailsLoading(true);
    setError("");
    setFeedback("");
    setShowPayment(false);
    setCopyFeedback("");
    setConfirmCancel(false);
    try {
      const reservation = await buscarMinhaReserva(id);
      setDetails(reservation);
      setCustomer({
        nome: reservation.cliente?.nome || "",
        telefone: reservation.cliente?.telefone || "",
      });
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message || "Nao foi possivel carregar a reserva.");
      }
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadReservations = async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listarMinhasReservas();
      setReservations(items);
      const nextId = items.some((item) => item.id === selectedId) ? selectedId : items[0]?.id || null;
      setSelectedId(nextId);
      if (nextId) await loadDetails(nextId);
      else setDetails(null);
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message || "Nao foi possivel carregar suas reservas.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    buscarSessaoEmail()
      .then((response) => {
        if (active && response?.verificado) setSession(response);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSessionLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session?.verificado) return undefined;
    const timeout = window.setTimeout(() => {
      void loadReservations();
    }, 0);
    return () => window.clearTimeout(timeout);
  // selectedId is intentionally managed by loadReservations.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.verificado]);

  useEffect(() => {
    if (!details?.pagamento?.expiraEm || !details?.acoes?.podeContinuarPagamento) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [details?.acoes?.podeContinuarPagamento, details?.pagamento?.expiraEm]);

  const selectedSummary = useMemo(
    () => reservations.find((reservation) => reservation.id === selectedId),
    [reservations, selectedId],
  );

  const selectReservation = (id) => {
    setSelectedId(id);
    setEditing(false);
    void loadDetails(id);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    if (!details) return;
    setBusyAction(true);
    setError("");
    setFeedback("");
    try {
      const response = await atualizarDadosMinhaReserva(details.id, customer);
      setDetails((current) => ({ ...current, cliente: { ...current.cliente, ...response.cliente } }));
      setReservations((current) => current.map((reservation) => ({
        ...reservation,
        cliente: reservation.cliente ? { ...reservation.cliente, ...response.cliente } : reservation.cliente,
      })));
      setEditing(false);
      setFeedback("Nome e telefone atualizados.");
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message || "Nao foi possivel atualizar os dados.");
      }
    } finally {
      setBusyAction(false);
    }
  };

  const cancelReservation = async () => {
    if (!details) return;
    setBusyAction(true);
    setError("");
    setFeedback("");
    try {
      const response = await cancelarMinhaReserva(details.id);
      setDetails(response.reserva);
      setReservations((current) => current.map((reservation) => (
        reservation.id === response.reserva.id ? { ...reservation, ...response.reserva } : reservation
      )));
      setConfirmCancel(false);
      setShowPayment(false);
      setFeedback("Reserva cancelada e horario liberado.");
    } catch (requestError) {
      if (!handleSessionExpired(requestError)) {
        setError(requestError.message || "Nao foi possivel cancelar a reserva.");
      }
    } finally {
      setBusyAction(false);
    }
  };

  const closeSession = async () => {
    setBusyAction(true);
    try {
      await encerrarSessaoEmail();
      setSession(null);
      setReservations([]);
      setDetails(null);
      setSelectedId(null);
    } catch (requestError) {
      setError(requestError.message || "Nao foi possivel encerrar a sessao.");
    } finally {
      setBusyAction(false);
    }
  };

  const copyPix = async () => {
    const code = details?.pagamento?.pix?.qrCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback("Codigo Pix copiado.");
    } catch {
      setCopyFeedback("Selecione o codigo e copie manualmente.");
    }
  };

  return (
    <>
      <main className="my-reservations-page">
        <section className="my-reservations-hero">
          <header className="page-shell my-reservations-header">
            <a className="brand brand--reservation brand--image" href="/" aria-label={`${brand.name}, inicio`}>
              <img className="brand__logo-image" src="/images/logo/logo-pe-na-areia-header-white.png" alt={brand.name} />
            </a>
            <a className="button button--primary my-reservations-header__back" href="/reserva">
              <span>
                <Plus aria-hidden="true" size={19} />
                Nova reserva
              </span>
            </a>
          </header>

          <div className="page-shell my-reservations-title">
            <p>Área do cliente</p>
            <h1>MINHAS RESERVAS</h1>
            <span>Consulte seus horários, acompanhe pagamentos e gerencie suas reservas.</span>
          </div>
        </section>

        <section className="page-shell my-reservations-workspace">
          {sessionLoading ? (
            <p className="my-reservations-state" role="status">Verificando seu acesso...</p>
          ) : !session?.verificado ? (
            <div className="my-reservations-access-stage">
              <EmailVerificationAccess onVerified={(response) => setSession({ ...response, verificado: true })} />
              <div className="my-reservations-benefits" aria-label="Benefícios do acesso">
                <article>
                  <span><Check aria-hidden="true" size={22} /></span>
                  <div><strong>Seguro</strong><p>Seus dados protegidos.</p></div>
                </article>
                <article>
                  <span><Clock3 aria-hidden="true" size={22} /></span>
                  <div><strong>Rápido</strong><p>Acesso em poucos segundos.</p></div>
                </article>
                <article>
                  <span><CalendarDays aria-hidden="true" size={22} /></span>
                  <div><strong>Completo</strong><p>Todas as suas reservas em um só lugar.</p></div>
                </article>
              </div>
            </div>
          ) : (
            <>
              <div className="my-reservations-session">
                <span><Check aria-hidden="true" size={17} /> E-mail verificado: <strong>{session.email}</strong></span>
                <button type="button" onClick={closeSession} disabled={busyAction}>
                  <LogOut aria-hidden="true" size={17} />
                  Sair
                </button>
              </div>

              {error && <p className="my-reservations-error" role="alert">{error}</p>}
              {feedback && <p className="my-reservations-feedback" role="status">{feedback}</p>}

              {loading ? (
                <p className="my-reservations-state" role="status">Carregando reservas...</p>
              ) : reservations.length === 0 ? (
                <div className="my-reservations-empty">
                  <CalendarDays aria-hidden="true" size={30} />
                  <h2>Nenhuma reserva encontrada</h2>
                  <p>As reservas feitas com este e-mail aparecerao aqui.</p>
                  <a href="/reserva">Reservar uma quadra</a>
                </div>
              ) : (
                <div className="my-reservations-layout">
                  <aside className="my-reservations-list" aria-label="Lista de reservas">
                    <div className="my-reservations-list__heading">
                      <strong>{reservations.length}</strong>
                      <span>{reservations.length === 1 ? "reserva" : "reservas"}</span>
                      <button type="button" onClick={loadReservations} disabled={loading} title="Atualizar reservas">
                        <RefreshCw aria-hidden="true" size={17} />
                      </button>
                    </div>
                    {reservations.map((reservation) => (
                      <button
                        className={`my-reservation-row${reservation.id === selectedId ? " is-selected" : ""}`}
                        type="button"
                        key={reservation.id}
                        onClick={() => selectReservation(reservation.id)}
                      >
                        <time dateTime={reservation.data}>
                          <strong>{String(reservation.data || "").slice(8, 10)}</strong>
                          <span>{new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(`${reservation.data}T12:00:00`))}</span>
                        </time>
                        <span className="my-reservation-row__main">
                          <strong>{reservation.quadra?.nome || "Quadra"}</strong>
                          <small>{reservation.modalidade?.nome || "Modalidade"} · {String(reservation.horaInicio || "").slice(0, 5)}</small>
                        </span>
                        <span className={`my-reservation-status my-reservation-status--${reservation.status}`}>
                          {reservationStatus[reservation.status] || reservation.status}
                        </span>
                      </button>
                    ))}
                  </aside>

                  <section className="my-reservation-detail" aria-live="polite">
                    {detailsLoading || !details ? (
                      <p className="my-reservations-state">Carregando detalhes...</p>
                    ) : (
                      <>
                        <header>
                          <div>
                            <p>Reserva #{details.id}</p>
                            <h2>{details.quadra?.nome || selectedSummary?.quadra?.nome}</h2>
                            <span>{details.modalidade?.nome}</span>
                          </div>
                          <span className={`my-reservation-status my-reservation-status--${details.status}`}>
                            {reservationStatus[details.status] || details.status}
                          </span>
                        </header>

                        <div className="my-reservation-facts">
                          <span><CalendarDays aria-hidden="true" size={18} /><small>Data</small><strong>{formatDate(details.data)}</strong></span>
                          <span><Clock3 aria-hidden="true" size={18} /><small>Horario</small><strong>{String(details.horaInicio || "").slice(0, 5)} - {String(details.horaFim || "").slice(0, 5)}</strong></span>
                          <span><CreditCard aria-hidden="true" size={18} /><small>Valor</small><strong>{formatCurrency(details.valorTotal)}</strong></span>
                        </div>

                        <div className="my-reservation-payment-summary">
                          <span><small>Pagamento</small><strong>{paymentStatus[details.pagamento?.status] || details.pagamento?.status}</strong></span>
                          <span><small>Forma</small><strong>{paymentMethodLabel(details.pagamento?.forma)}</strong></span>
                          <span><small>Prazo</small><strong>{formatRemaining(details.pagamento?.expiraEm, now)}</strong></span>
                        </div>

                        {showPayment && details.pagamento?.forma === "pix" && details.pagamento?.pix && (
                          <div className="my-reservation-pix">
                            {details.pagamento.pix.qrCodeBase64 ? (
                              <img src={`data:image/png;base64,${details.pagamento.pix.qrCodeBase64}`} alt="QR Code Pix da reserva" />
                            ) : <QrCode aria-hidden="true" size={88} />}
                            <div>
                              <strong>Continue o pagamento Pix</strong>
                              <p>Use o QR Code ou o codigo existente antes do prazo encerrar.</p>
                              {details.pagamento.pix.qrCode && <textarea readOnly rows={4} value={details.pagamento.pix.qrCode} />}
                              <div>
                                {details.pagamento.pix.qrCode && <button type="button" onClick={copyPix}><Copy aria-hidden="true" size={17} /> Copiar codigo</button>}
                                {details.pagamento.pix.ticketUrl && <a href={details.pagamento.pix.ticketUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" size={17} /> Abrir Pix</a>}
                              </div>
                              {copyFeedback && <small>{copyFeedback}</small>}
                            </div>
                          </div>
                        )}

                        <section className="my-reservation-customer">
                          <header>
                            <span><UserRound aria-hidden="true" size={19} /> Dados do cliente</span>
                            {!editing && <button type="button" onClick={() => setEditing(true)}><Pencil aria-hidden="true" size={16} /> Editar</button>}
                          </header>
                          {editing ? (
                            <form onSubmit={saveCustomer}>
                              <label>Nome<input value={customer.nome} onChange={(event) => setCustomer((current) => ({ ...current, nome: event.target.value }))} /></label>
                              <label>Telefone<input type="tel" value={customer.telefone} onChange={(event) => setCustomer((current) => ({ ...current, telefone: event.target.value }))} /></label>
                              <span>E-mail verificado<strong>{details.cliente?.email}</strong></span>
                              <div><button type="button" onClick={() => setEditing(false)}>Cancelar</button><button type="submit" disabled={busyAction}>Salvar dados</button></div>
                            </form>
                          ) : (
                            <div><span><small>Nome</small><strong>{details.cliente?.nome}</strong></span><span><small>Telefone</small><strong>{details.cliente?.telefone}</strong></span><span><small>E-mail</small><strong>{details.cliente?.email}</strong></span></div>
                          )}
                        </section>

                        <footer className="my-reservation-actions">
                          {details.acoes?.podeContinuarPagamento && details.pagamento?.forma === "pix" && (
                            <button type="button" onClick={() => setShowPayment((current) => !current)}><QrCode aria-hidden="true" size={18} />{showPayment ? "Ocultar Pix" : "Continuar Pix"}</button>
                          )}
                          {details.acoes?.podeContinuarPagamento && details.pagamento?.forma === "cartao" && details.pagamento?.checkoutUrl && (
                            <a href={details.pagamento.checkoutUrl}><CreditCard aria-hidden="true" size={18} />Continuar no cartao<ExternalLink aria-hidden="true" size={16} /></a>
                          )}
                          {details.acoes?.podeCancelar && !confirmCancel && (
                            <button className="is-danger" type="button" onClick={() => setConfirmCancel(true)}><Trash2 aria-hidden="true" size={18} />Cancelar reserva</button>
                          )}
                          {confirmCancel && (
                            <div className="my-reservation-cancel-confirm"><span>Cancelar esta reserva e liberar o horario?</span><button type="button" onClick={() => setConfirmCancel(false)}>Manter</button><button type="button" onClick={cancelReservation} disabled={busyAction}>Confirmar cancelamento</button></div>
                          )}
                        </footer>
                      </>
                    )}
                  </section>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
