// ðŸ“ /frontend/src/App.js
// REEMPLAZA COMPLETAMENTE tu App.js actual con este contenido

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Páginas principales (mantenidas en pages/)
import LoginPage from "./pages/LoginPage";

// Componentes compartidos (movidos a shared/)
import AdminLayout from "./shared/components/Layout/AdminLayout";
import RoleProtectedRoute from "./shared/components/Layout/RoleProtectedRoute";

// Core modules
import UsersPage from "./core/users/pages/UsersPage";
import ProductsPage from "./core/products/pages/ProductsPage";
import SalesPage from "./core/sales/pages/SalesPage";

// Optional modules
import TiendasPage from "./modules/tiendas/pages/TiendasPage";
import ClientesPage from "./modules/clientes/pages/ClientesPage";
import EmpleadosPage from "./modules/empleados/pages/EmpleadosPage";
import EmployeeHistoryPage from "./modules/empleados/pages/EmployeeHistoryPage";
import GastosPage from "./core/gastos/pages/GastosPage";
import OrdersPage from "./core/delivery/pages/OrdersPage";
import OrderTrackingPage from "./core/delivery/pages/OrderTrackingPage";
import DevolucionesPage from "./core/devoluciones/pages/DevolucionesPage";
import CajaPage from "./core/caja/pages/CajaPage";
import VacacionesRequestPage from "./modules/vacaciones/pages/VacacionesRequestPage";
import VacacionesAdminPage from "./modules/vacaciones/pages/VacacionesAdminPage";
import ReportesPage from "./modules/reportes/pages/ReportesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta de login */}
        <Route path="/" element={<LoginPage />} />

        {/* Core modules - Tiendas */}
        <Route
          path="/admin/tiendas"
          element={
            <AdminLayout> 
              <TiendasPage />
            </AdminLayout>
          }
        />

        {/* Core modules - Usuarios */}
        <Route
          path="/admin/usuarios"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <UsersPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Core modules - Productos */}
        <Route
          path="/admin/productos"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ProductsPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Core modules - Ventas */}
        <Route
          path="/admin/ventas"
          element={
            <AdminLayout>
              <SalesPage />
            </AdminLayout>
          }
        />

        {/* Optional modules - Devoluciones */}
        <Route
          path="/admin/devoluciones"
          element={
            <AdminLayout>
              <DevolucionesPage />
            </AdminLayout>
          }
        />

        {/* Optional modules - Reportes */}
        <Route
          path="/admin/reportes"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ReportesPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Optional modules - Clientes */}
        <Route
          path="/admin/clientes"
          element={
            <AdminLayout>
              <ClientesPage />
            </AdminLayout>
          }
        />

        {/* Optional modules - Empleados */}
        <Route
          path="/admin/empleados"
          element={
            <AdminLayout>
              <EmpleadosPage />
            </AdminLayout>
          }
        />

        {/* Optional modules - Gastos */}
        <Route
          path="/admin/gastos"
          element={
            <AdminLayout>
              <GastosPage />
            </AdminLayout>
          }
        />

        {/* Optional modules - Delivery/Ã“rdenes */}
        <Route
          path="/admin/ordenes"
          element={
            <AdminLayout>
              <OrdersPage />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/seguimiento-pedidos"
          element={
            <AdminLayout>
              <OrderTrackingPage />
            </AdminLayout>
          }
        />

        {/* Optional modules - Historial de Empleados */}
        <Route
          path="/admin/historial-empleados"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <EmployeeHistoryPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Optional modules - Caja */}
        <Route
          path="/admin/caja"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <CajaPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Optional modules - Vacaciones */}
        <Route
          path="/vacaciones"
          element={
            <AdminLayout> 
              <RoleProtectedRoute allowedRoles={["admin", "vendedor", "repartidor"]}>
                <VacacionesRequestPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/vacaciones"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <VacacionesAdminPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
