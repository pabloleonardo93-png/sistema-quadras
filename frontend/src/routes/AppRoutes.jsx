import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import AdminClientes from "../pages/AdminClientes";
import AdminComunicados from "../pages/AdminComunicados";
import AdminDashboard from "../pages/AdminDashboard";
import AdminHorarios from "../pages/AdminHorarios";
import AdminLogin from "../pages/AdminLogin";
import AdminModalidades from "../pages/AdminModalidades";
import AdminQuadras from "../pages/AdminQuadras";
import AdminRelatorios from "../pages/AdminRelatorios";
import AdminReservas from "../pages/AdminReservas";
import PrivateRoute from "./PrivateRoute";
import PagamentoRetorno from "../pages/PagamentoRetorno";
import PrivacyCookiesPage from "../pages/PrivacyCookiesPage";
import ReservaPage from "../pages/ReservaPage";
import MinhasReservas from "../pages/MinhasReservas";

function protectedPage(page) {
  return <PrivateRoute>{page}</PrivateRoute>;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reserva" element={<ReservaPage />} />
        <Route path="/reserva/dados" element={<ReservaPage />} />
        <Route path="/minhas-reservas" element={<MinhasReservas />} />
        <Route path="/pagamento/retorno" element={<PagamentoRetorno />} />
        <Route path="/privacidade-e-cookies" element={<PrivacyCookiesPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={protectedPage(<AdminDashboard />)} />
        <Route path="/admin/reservas" element={protectedPage(<AdminReservas />)} />
        <Route path="/admin/quadras" element={protectedPage(<AdminQuadras />)} />
        <Route path="/admin/modalidades" element={protectedPage(<AdminModalidades />)} />
        <Route path="/admin/horarios" element={protectedPage(<AdminHorarios />)} />
        <Route path="/admin/clientes" element={protectedPage(<AdminClientes />)} />
        <Route path="/admin/comunicados" element={protectedPage(<AdminComunicados />)} />
        <Route path="/admin/relatorios" element={protectedPage(<AdminRelatorios />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
