import { useState } from "react";
import { formatBrazilianPhone, validateBrazilianPhone } from "../../../shared/formatters/telefone";

const emptyCustomer = { name: "", phone: "", email: "" };

export function useDadosCliente({ onResetPaymentState }) {
  const [customer, setCustomer] = useState(emptyCustomer);
  const [customerProfileLoaded, setCustomerProfileLoaded] = useState(false);

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    onResetPaymentState();
    setCustomer((current) => ({
      ...current,
      [name]: name === "phone" ? formatBrazilianPhone(value) : value,
    }));
  };

  const validateBooking = ({
    date,
    selectedCourt,
    selectedCourtData,
    selectedHorario,
    selectedModality,
    selectedModalityData,
    selectedTime,
    verifiedEmail,
  }) => {
    if (
      !selectedModality ||
      !selectedCourt ||
      !date ||
      !selectedTime ||
      !selectedCourtData?.apiId ||
      !selectedModalityData?.apiId ||
      !selectedHorario?.apiId ||
      !customer.name ||
      !customer.phone ||
      !customer.email ||
      !verifiedEmail?.email
    ) {
      return "Preencha todos os campos para continuar para o pagamento.";
    }

    if (customer.email !== verifiedEmail.email) {
      return "Valide o e-mail antes de continuar para o pagamento.";
    }

    return validateBrazilianPhone(customer.phone);
  };

  const resetCustomer = () => {
    setCustomer(emptyCustomer);
  };

  return {
    customer,
    customerProfileLoaded,
    handleCustomerChange,
    resetCustomer,
    setCustomer,
    setCustomerProfileLoaded,
    validateBooking,
  };
}
