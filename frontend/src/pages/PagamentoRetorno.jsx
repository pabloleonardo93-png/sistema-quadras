import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";
import { buscarStatusReserva } from "../services/reservaService";

const statusText = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmada: "Reserva confirmada",
  cancelada: "Reserva cancelada",
  expirada: "Reserva expirada",
  finalizada: "Reserva finalizada",
};

const paymentText = {
  pendente: "Pagamento pendente",
  aprovado: "Pagamento aprovado",
  recusado: "Pagamento recusado",
  cancelado: "Pagamento cancelado",
  estornado: "Pagamento estornado",
};

function visualState(status, paymentStatus) {
  if (status === "confirmada" || paymentStatus === "aprovado") {
    return {
      icon: CheckCircle2,
      title: "Pagamento recebido.",
      text: "Sua reserva foi confirmada. A equipe ja consegue acompanhar tudo pelo painel administrativo.",
      tone: "success",
    };
  }

  if (status === "cancelada" || status === "expirada" || ["recusado", "cancelado", "estornado"].includes(paymentStatus)) {
    return {
      icon: AlertCircle,
      title: "Pagamento nao confirmado.",
      text: "A reserva nao foi confirmada. Escolha outro horario ou fale com a equipe para ajustar.",
      tone: "danger",
    };
  }

  return {
    icon: Clock3,
    title: "Pagamento em analise.",
    text: "O Mercado Pago ainda esta processando o retorno. Atualize a pagina em alguns instantes.",
    tone: "pending",
  };
}

export default function PagamentoRetorno() {
  const [params] = useSearchParams();
  const reservaId = params.get("reserva");
  const [reserva, setReserva] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(reservaId));

  useEffect(() => {
    let active = true;

    async function carregarReserva() {
      if (!reservaId) {
        setError("Reserva nao informada no retorno do pagamento.");
        setIsLoading(false);
        return;
      }

      try {
        const data = await buscarStatusReserva(reservaId);
        if (active) setReserva(data);
      } catch (requestError) {
        if (active) {
          setError(requestError.message || "Nao foi possivel consultar o status da reserva.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void carregarReserva();

    return () => {
      active = false;
    };
  }, [reservaId]);

  const state = useMemo(
    () => visualState(reserva?.status, reserva?.pagamentoStatus),
    [reserva?.status, reserva?.pagamentoStatus],
  );
  const Icon = state.icon;

  return (
    <main className="payment-return">
      <section className="payment-return__panel">
        <BrandMark className="payment-return__brand" />
        <span className={`payment-return__icon payment-return__icon--${state.tone}`}>
          <Icon aria-hidden="true" size={34} />
        </span>

        {isLoading ? (
          <>
            <p className="payment-return__eyebrow">Consultando reserva</p>
            <h1>Verificando pagamento...</h1>
            <p>Aguarde enquanto buscamos o status atualizado.</p>
          </>
        ) : error ? (
          <>
            <p className="payment-return__eyebrow">Retorno de pagamento</p>
            <h1>Nao foi possivel consultar.</h1>
            <p>{error}</p>
          </>
        ) : (
          <>
            <p className="payment-return__eyebrow">Retorno de pagamento</p>
            <h1>{state.title}</h1>
            <p>{state.text}</p>
            <div className="payment-return__summary">
              <span>{reserva?.quadra?.nome || "Quadra"}</span>
              <strong>
                {reserva?.data} as {String(reserva?.horaInicio || "").slice(0, 5)}
              </strong>
              <small>
                {statusText[reserva?.status] || reserva?.status} /{" "}
                {paymentText[reserva?.pagamentoStatus] || reserva?.pagamentoStatus}
              </small>
            </div>
          </>
        )}

        <div className="payment-return__actions">
          <Link to="/">Voltar ao site</Link>
          <Link to="/admin/reservas">Painel de reservas</Link>
        </div>
      </section>
    </main>
  );
}
