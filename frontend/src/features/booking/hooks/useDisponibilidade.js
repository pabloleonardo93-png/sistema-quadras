import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listarDisponibilidadeHorarios } from "../services/bookingService";
import { getNextOpenDate, isDateParam, isOpenDate } from "../utils/date";

export function useDisponibilidade({
  courts = [],
  dateFallback = getNextOpenDate,
  initialDate,
  initialTimeId,
  isCustomerDataRoute = false,
  modalities = [],
  onCourtChange,
  onModalityChange,
  onResetReservationProgress,
  selectedCourt,
  selectedModality,
  setError,
}) {
  const navigate = useNavigate();
  const [date, setDate] = useState(() =>
    isDateParam(initialDate) ? initialDate : dateFallback(),
  );
  const [selectedTime, setSelectedTime] = useState(() =>
    initialTimeId ? String(initialTimeId) : "",
  );
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timesLoading, setTimesLoading] = useState(false);
  const [timesError, setTimesError] = useState("");
  const [mostrarDados, setMostrarDados] = useState(isCustomerDataRoute);
  const preferredTimeRef = useRef("");
  const dateInputRef = useRef(null);

  const selectedCourtData = useMemo(
    () => courts.find((court) => court.id === selectedCourt),
    [courts, selectedCourt],
  );

  const selectedModalityData = useMemo(
    () => modalities.find((modality) => modality.name === selectedModality),
    [modalities, selectedModality],
  );

  const selectedHorario = useMemo(
    () => availableTimes.find((time) => time.id === selectedTime),
    [availableTimes, selectedTime],
  );

  const valorFormatado = Number(selectedCourtData?.valorHora || 0)
    .toFixed(2)
    .replace(".", ",");

  const dataFormatada = date
    ? new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T12:00:00`))
    : "--";

  useEffect(() => {
    let active = true;

    async function carregarHorarios() {
      if (!selectedCourtData?.apiId || !date) {
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesLoading(false);
        setTimesError("");
        return;
      }

      if (!isOpenDate(date)) {
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesLoading(false);
        setTimesError("A arena funciona de terça a domingo, das 08:00 às 22:00.");
        return;
      }

      setTimesLoading(true);
      setTimesError("");

      try {
        const horarios = await listarDisponibilidadeHorarios({
          quadraId: selectedCourtData.apiId,
          modalidadeId: selectedModalityData?.apiId,
          data: date,
        });

        if (!active) return;

        const horariosDaQuadra = horarios.filter((horario) => {
          const horaInicio = String(horario.horaInicio || "").slice(0, 5);
          return (
            Number(horario.quadraId) === Number(selectedCourtData.apiId) &&
            horaInicio >= "08:00" &&
            horaInicio < "22:00"
          );
        });
        const horariosUnicos = Array.from(
          new Map(
            horariosDaQuadra.map((horario) => [
              String(horario.horaInicio || "").slice(0, 5),
              horario,
            ]),
          ).values(),
        );

        const normalizados = horariosUnicos.map((horario) => ({
          id: String(horario.id),
          apiId: horario.id,
          time: String(horario.horaInicio || "").slice(0, 5),
          available: horario.status === "disponivel",
        }));

        setAvailableTimes(normalizados);
        setSelectedTime((current) => {
          const requestedTime = initialTimeId ? String(initialTimeId) : "";

          if (
            requestedTime &&
            normalizados.some((horario) => horario.id === requestedTime && horario.available)
          ) {
            return requestedTime;
          }

          const currentHorario = normalizados.find(
            (horario) => horario.id === current && horario.available,
          );

          if (currentHorario) {
            preferredTimeRef.current = currentHorario.time;
            return current;
          }

          const horarioPreferido = normalizados.find(
            (horario) => horario.available && horario.time === preferredTimeRef.current,
          );

          return horarioPreferido?.id || "";
        });
      } catch {
        if (!active) return;
        setAvailableTimes([]);
        setSelectedTime("");
        setMostrarDados(false);
        setTimesError("Não foi possível carregar os horários disponíveis.");
      } finally {
        if (active) setTimesLoading(false);
      }
    }

    carregarHorarios();

    return () => {
      active = false;
    };
  }, [date, initialTimeId, selectedCourtData?.apiId, selectedModalityData?.apiId]);

  const resetReservationProgress = ({ keepSelectedTime = false } = {}) => {
    onResetReservationProgress();
    setMostrarDados(false);
    if (!keepSelectedTime) {
      preferredTimeRef.current = "";
      setSelectedTime("");
    }
  };

  const handleSelectionChange = (callback, options = {}) => (value) => {
    resetReservationProgress(options);
    callback(value);
  };

  const handleModalityChange = (event) =>
    handleSelectionChange(onModalityChange, { keepSelectedTime: true })(event.target.value);

  const handleCourtChange = (event) =>
    handleSelectionChange(onCourtChange, { keepSelectedTime: true })(event.target.value);

  const handleOpenDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    input.focus();
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      }
    } catch {
      // Alguns navegadores bloqueiam showPicker fora do gesto de clique.
    }
  };

  const handleDateChange = (value) => {
    resetReservationProgress({ keepSelectedTime: true });
    setDate(value);
  };

  const handleTimeSelect = (timeId) => {
    const horarioSelecionado = availableTimes.find((horario) => horario.id === timeId);
    preferredTimeRef.current = horarioSelecionado?.time || "";
    resetReservationProgress({ keepSelectedTime: true });
    setSelectedTime(timeId);
  };

  const handleContinueToCustomerData = () => {
    if (!selectedHorario?.apiId) {
      setError("Selecione um horário disponível para continuar.");
      return;
    }

    const params = new URLSearchParams({
      quadra: selectedCourt,
      modalidade: selectedModality,
      data: date,
      horario: String(selectedHorario.apiId),
    });

    setError("");
    navigate(`/reserva/dados?${params.toString()}`);
  };

  const closeCustomerDataStep = () => {
    setMostrarDados(false);
  };

  return {
    availableTimes,
    closeCustomerDataStep,
    courts,
    dataFormatada,
    date,
    dateInputRef,
    handleContinueToCustomerData,
    handleCourtChange,
    handleDateChange,
    handleModalityChange,
    handleOpenDatePicker,
    handleTimeSelect,
    modalities,
    mostrarDados,
    resetReservationProgress,
    selectedCourt,
    selectedCourtData,
    selectedHorario,
    selectedModality,
    selectedModalityData,
    selectedTime,
    timesError,
    timesLoading,
    valorFormatado,
  };
}
