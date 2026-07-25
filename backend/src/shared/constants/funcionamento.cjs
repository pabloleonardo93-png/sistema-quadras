const HORA_ABERTURA = "08:00";
const HORA_FECHAMENTO = "22:00";
const DIAS_SEM_FUNCIONAMENTO = Object.freeze([1]);

function funcionaNaData(data) {
  const [ano, mes, dia] = String(data || "").split("-").map(Number);
  const diaSemana = new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
  return !DIAS_SEM_FUNCIONAMENTO.includes(diaSemana);
}

module.exports = {
  DIAS_SEM_FUNCIONAMENTO,
  HORA_ABERTURA,
  HORA_FECHAMENTO,
  funcionaNaData,
};
