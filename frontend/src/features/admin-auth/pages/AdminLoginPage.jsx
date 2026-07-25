import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { brand } from "../../../constants/brand";
import { login as loginAdmin } from "../../../services/authService";

export default function AdminLoginPage() {
  const navigateRouter = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await loginAdmin({ email, senha: password });
      navigateRouter("/admin/dashboard", { replace: true });
    } catch {
      setError("E-mail ou senha invalidos. Verifique os dados e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="admin-login">
      <section className="admin-login__brand">
        <a className="admin-login__back" href="/">
          Voltar ao site público
        </a>
        <div className="admin-login__logo" aria-label={brand.name}>
          <img
            src="/images/logo/logo-pe-na-areia-favicon-blue.png"
            alt=""
            aria-hidden="true"
          />
          <span>{brand.nameUpper}</span>
        </div>
        <span className="admin-login__eyebrow">{brand.adminName}</span>
        <h1>Gestão da arena em tempo real.</h1>
        <p>
          Acompanhe reservas, quadras, clientes e comunicados em uma área
          administrativa protegida.
        </p>
        <div className="admin-login__security">
          <ShieldCheck aria-hidden="true" />
          <span>Acesso seguro para a equipe do complexo.</span>
        </div>
      </section>

      <form className="admin-login__card" aria-label="Login administrativo" onSubmit={handleSubmit}>
        <span className="admin-login__card-kicker">Acesso do gestor</span>
        <h2>Entrar no painel</h2>
        <label>
          E-mail
          <div>
            <Mail aria-hidden="true" size={18} />
            <input
              type="email"
              name="email"
              placeholder="admin@teste.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </label>
        <label>
          Senha
          <div className="admin-login__password-field">
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="senha"
              placeholder="********"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="admin-login__password-toggle"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={18} />
              ) : (
                <Eye aria-hidden="true" size={18} />
              )}
            </button>
          </div>
        </label>
        {error && (
          <p className="admin-login__error" role="alert">
            {error}
          </p>
        )}
        <button
          className="admin-button admin-button--primary admin-login__submit"
          type="submit"
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "Entrando..." : "Entrar"}</span>
          <ChevronRight aria-hidden="true" size={18} />
        </button>
        <p className="admin-login__help">
          Esqueceu a senha? Fale com o administrador.
        </p>
      </form>
    </main>
  );
}
