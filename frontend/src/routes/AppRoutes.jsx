import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import PrivateRoute from "./PrivateRoute";
import PagamentoRetorno from "../pages/PagamentoRetorno";
import ReservaPage from "../pages/ReservaPage";

const AdminClientesPage = lazy(() => import("../features/admin-clientes/pages/AdminClientesPage"));
const AdminComunicadosPage = lazy(() => import("../features/admin-comunicados/pages/AdminComunicadosPage"));
const AdminDashboardPage = lazy(() => import("../features/admin-dashboard/pages/AdminDashboardPage"));
const AdminHorariosPage = lazy(() => import("../features/admin-horarios/pages/AdminHorariosPage"));
const AdminLoginPage = lazy(() => import("../features/admin-auth/pages/AdminLoginPage"));
const AdminModalidadesPage = lazy(() => import("../features/admin-modalidades/pages/AdminModalidadesPage"));
const AdminQuadrasPage = lazy(() => import("../features/admin-quadras/pages/AdminQuadrasPage"));
const AdminRelatoriosPage = lazy(() => import("../features/admin-relatorios/pages/AdminRelatoriosPage"));
const AdminReservasPage = lazy(() => import("../features/admin-reservas/pages/AdminReservasPage"));

function adminFallback() {
  return (
    <main className="admin-page">
      <p className="admin-muted">Carregando painel...</p>
    </main>
  );
}

function adminPage(page) {
  return <Suspense fallback={adminFallback()}>{page}</Suspense>;
}

function protectedPage(page) {
  return <PrivateRoute>{adminPage(page)}</PrivateRoute>;
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
        <Route path="/admin/login" element={adminPage(<AdminLoginPage />)} />
        <Route path="/admin/dashboard" element={protectedPage(<AdminDashboardPage />)} />
        <Route path="/admin/reservas" element={protectedPage(<AdminReservasPage />)} />
        <Route path="/admin/quadras" element={protectedPage(<AdminQuadrasPage />)} />
        <Route path="/admin/modalidades" element={protectedPage(<AdminModalidadesPage />)} />
        <Route path="/admin/horarios" element={protectedPage(<AdminHorariosPage />)} />
        <Route path="/admin/clientes" element={protectedPage(<AdminClientesPage />)} />
        <Route path="/admin/comunicados" element={protectedPage(<AdminComunicadosPage />)} />
        <Route path="/admin/relatorios" element={protectedPage(<AdminRelatoriosPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
