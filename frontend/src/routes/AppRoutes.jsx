import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import PrivateRoute from "./PrivateRoute";
import PagamentoRetorno from "../pages/PagamentoRetorno";
import ReservaPage from "../pages/ReservaPage";
import { AdminLogin, AdminPanel } from "../pages/admin/AdminPanel";

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
        <Route path="/pagamento/retorno" element={<PagamentoRetorno />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={protectedPage(<AdminPanel route="dashboard" />)} />
        <Route path="/admin/reservas" element={protectedPage(<AdminPanel route="reservas" />)} />
        <Route path="/admin/quadras" element={protectedPage(<AdminPanel route="quadras" />)} />
        <Route path="/admin/modalidades" element={protectedPage(<AdminPanel route="modalidades" />)} />
        <Route path="/admin/horarios" element={protectedPage(<AdminPanel route="horarios" />)} />
        <Route path="/admin/clientes" element={protectedPage(<AdminPanel route="clientes" />)} />
        <Route path="/admin/comunicados" element={protectedPage(<AdminPanel route="comunicados" />)} />
        <Route path="/admin/relatorios" element={protectedPage(<AdminPanel route="relatorios" />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
