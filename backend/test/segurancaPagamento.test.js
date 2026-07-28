import assert from "node:assert/strict";
import test from "node:test";

process.env.MERCADO_PAGO_WEBHOOK_SECRET = "segredo-de-teste-webhook";

const {
  proximaTentativaPagamento,
  validarAssinaturaWebhookMercadoPago,
  valorEmCentavos,
  webhookConfereComReserva,
} = await import("../src/services/mercadoPagoService.js");

test("rejeita webhook sem assinatura ou com assinatura invalida", () => {
  assert.throws(() => validarAssinaturaWebhookMercadoPago({ paymentId: "123" }), { status: 401 });
  assert.throws(() => validarAssinaturaWebhookMercadoPago({ paymentId: "123", requestId: "req", signature: "ts=1,v1=invalida" }), { status: 401 });
});

test("normaliza valores monetarios sem aceitar formatos ambiguos", () => {
  assert.equal(valorEmCentavos("85.00"), 8500);
  assert.equal(valorEmCentavos("85,5"), 8550);
  assert.equal(valorEmCentavos("85.009"), null);
  assert.equal(valorEmCentavos("abc"), null);
});

test("calcula tentativa de pagamento sem gerar valor invalido", () => {
  assert.equal(proximaTentativaPagamento({}), 1);
  assert.equal(proximaTentativaPagamento({ pagamentoTentativa: null }), 1);
  assert.equal(proximaTentativaPagamento({ pagamentoTentativa: 0 }), 1);
  assert.equal(proximaTentativaPagamento({ pagamentoTentativa: 2 }), 3);
});

test("webhook exige referencia, valor, moeda, tipo e tentativa da reserva", () => {
  const reserva = {
    id: 42,
    valorTotal: "85.00",
    pagamentoTipo: "pix",
    pagamentoTentativa: 2,
    mercadoPagoPaymentId: "mp-42",
    mercadoPagoPreferenceId: null,
  };
  const pagamento = {
    id: "mp-42",
    external_reference: "42",
    currency_id: "BRL",
    transaction_amount: "85.00",
    payment_method_id: "pix",
    metadata: { reserva_id: "42", payment_type: "pix", payment_attempt: "2" },
  };
  assert.equal(webhookConfereComReserva({ pagamento, reserva }), true);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamento, external_reference: "43" }, reserva }), false);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamento, currency_id: "USD" }, reserva }), false);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamento, transaction_amount: "84.99" }, reserva }), false);
});

test("aceita Checkout Pro de cartao sem preference_id na consulta, mas rejeita associacoes divergentes", () => {
  const reserva = {
    id: 43,
    valorTotal: "85.00",
    pagamentoTipo: "checkout",
    pagamentoTentativa: 3,
    mercadoPagoPreferenceId: "pref-43",
  };
  const pagamento = {
    id: "card-43",
    external_reference: "43",
    currency_id: "BRL",
    transaction_amount: "85.00",
    payment_method_id: "visa",
    metadata: { reserva_id: "43", payment_type: "checkout", payment_attempt: "3" },
  };

  assert.equal(webhookConfereComReserva({ pagamento, reserva }), true);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamento, external_reference: "44" }, reserva }), false);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamento, transaction_amount: "85.01" }, reserva }), false);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamento, currency_id: "USD" }, reserva }), false);
});

test("aceita legado apenas quando o identificador persistido tambem confere", () => {
  const reservaPix = {
    id: 44,
    valorTotal: "85.00",
    pagamentoTipo: "pix",
    pagamentoTentativa: 0,
    mercadoPagoPaymentId: "pix-legado-44",
  };
  const pagamentoPix = {
    id: "pix-legado-44",
    external_reference: "44",
    currency_id: "BRL",
    transaction_amount: "85.00",
    payment_method_id: "pix",
  };
  assert.equal(webhookConfereComReserva({ pagamento: pagamentoPix, reserva: reservaPix }), true);
  assert.equal(webhookConfereComReserva({ pagamento: { ...pagamentoPix, id: "outro" }, reserva: reservaPix }), false);
});
