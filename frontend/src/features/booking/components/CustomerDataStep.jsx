import { Lock, MailCheck } from "lucide-react";

export function CustomerDataStep({
  customer,
  onChange,
  onChangeVerifiedEmail,
}) {
  return (
    <>
      <div className="verified-contact-notice" role="status">
        <span>
          <MailCheck aria-hidden="true" size={20} />
        </span>
        <div>
          <strong>Contato confirmado</strong>
          <small>{customer.email} ja foi verificado para continuar.</small>
        </div>
      </div>
      <div className="form-grid">
        <label>
          Nome completo
          <input
            name="name"
            type="text"
            placeholder="Como podemos te chamar?"
            value={customer.name}
            onChange={onChange}
          />
        </label>
        <label>
          Telefone / WhatsApp
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={15}
            placeholder="(11) 99999-9999"
            value={customer.phone}
            onChange={onChange}
          />
        </label>
        <div className="verified-email-field form-grid__full">
          <label>
            E-mail validado
            <span className="locked-input">
              <input
                name="email"
                type="email"
                value={customer.email}
                readOnly
              />
              <Lock aria-hidden="true" size={18} />
            </span>
          </label>
          <button type="button" onClick={onChangeVerifiedEmail}>
            Trocar e-mail
          </button>
        </div>
      </div>
    </>
  );
}
