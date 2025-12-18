// ðŸ“ /frontend/src/App.js
// REEMPLAZA COMPLETAMENTE tu App.js actual con este contenido

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LicenseProvider } from "./shared/contexts/LicenseContext";

// Páginas principales (mantenidas en pages/)
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import PricingPage from "./pages/PricingPage";
import BillingPage from "./pages/BillingPage";
import BillingSuccessPage from "./pages/BillingSuccessPage";
import BillingCancelPage from "./pages/BillingCancelPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ActivateAccountPage from "./pages/ActivateAccountPage";

// Componentes compartidos (movidos a shared/)
import AdminLayout from "./shared/components/Layout/AdminLayout";
import RoleProtectedRoute from "./shared/components/Layout/RoleProtectedRoute";
import RestaurantProtectedRoute from "./shared/components/Layout/RestaurantProtectedRoute";

// Core modules
import UsersPage from "./core/users/pages/UsersPage";
import ProductsPage from "./core/products/pages/ProductsPage";
import SalesPage from "./core/sales/pages/SalesPage";

// Restaurant modules
import { TablesPage } from "./core/tables";
import { AccountPage } from "./core/accounts";
import { WaiterDashboard } from "./core/restaurant";
import KitchenPage from "./core/restaurant/pages/KitchenPage";

// Optional modules
import TiendasPage from "./modules/tiendas/pages/TiendasPage";
import ClientesPage from "./modules/clientes/pages/ClientesPage";
import EmpleadosPage from "./modules/empleados/pages/EmpleadosPage";
import EmployeeHistoryPage from "./modules/empleados/pages/EmployeeHistoryPage";
import GastosPage from "./core/gastos/pages/GastosPage";
import OrdersPage from "./core/delivery/pages/OrdersPage";
import OrderTrackingPage from "./core/delivery/pages/OrderTrackingPage";
import { PurchaseOrdersPage } from "./modules/purchaseOrders";
import DevolucionesPage from "./core/devoluciones/pages/DevolucionesPage";
import CajaPage from "./core/caja/pages/CajaPage";
import VacacionesRequestPage from "./modules/vacaciones/pages/VacacionesRequestPage";
import VacacionesAdminPage from "./modules/vacaciones/pages/VacacionesAdminPage";
import ReportesPage from "./modules/reportes/pages/ReportesPage";

function App() {
  return (
    <LicenseProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta de login */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Ruta de registro - DESHABILITADA (solo pago por adelantado) */}
          {/* Redirige a pricing en vez de permitir registro gratuito */}
          <Route path="/register" element={<PricingPage />} />

          {/* Ruta de onboarding */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Ruta de cambio de contraseña obligatorio */}
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Rutas de recuperación de contraseña */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Ruta de pricing pública */}
          <Route path="/pricing" element={<PricingPage />} />

          {/* Ruta de éxito de pago (público - para nuevos usuarios) */}
          <Route path="/payment-success" element={<PaymentSuccessPage />} />

          {/* Ruta de activación de cuenta (público - para nuevos usuarios) */}
          <Route path="/activate-account" element={<ActivateAccountPage />} />

          {/* Ruta de acceso no autorizado */}
          <Route path="/401" element={<UnauthorizedPage />} />

          {/* Rutas de Billing y Pricing */}
          <Route path="/admin/pricing" element={<AdminLayout><PricingPage /></AdminLayout>} />
          <Route path="/admin/billing" element={<AdminLayout><BillingPage /></AdminLayout>} />
          <Route path="/admin/billing/success" element={<BillingSuccessPage />} />
          <Route path="/admin/billing/cancel" element={<BillingCancelPage />} />

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

        {/* Optional modules - Órdenes de Compra */}
        <Route
          path="/admin/ordenes"
          element={
            <AdminLayout>
              <PurchaseOrdersPage />
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
              <RoleProtectedRoute allowedRoles={["admin", "vendedor"]}>
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

        {/* Restaurant modules - Gestión de Mesas (Admin) */}
        <Route
          path="/restaurant/tables"
          element={
            <AdminLayout>
              <RestaurantProtectedRoute>
                <TablesPage />
              </RestaurantProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Restaurant modules - Dashboard de Mesero */}
        <Route
          path="/restaurant/waiter"
          element={
            <AdminLayout>
              <RestaurantProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin", "vendedor"]}>
                  <WaiterDashboard />
                </RoleProtectedRoute>
              </RestaurantProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Restaurant modules - Pantalla de Cocina */}
        <Route
          path="/restaurant/kitchen"
          element={
            <AdminLayout>
              <RestaurantProtectedRoute>
                <KitchenPage />
              </RestaurantProtectedRoute>
            </AdminLayout>
          }
        />

        {/* Restaurant modules - Cuenta Individual */}
        <Route
          path="/restaurant/account/:accountId"
          element={
            <AdminLayout>
              <RestaurantProtectedRoute>
                <RoleProtectedRoute allowedRoles={["admin", "vendedor"]}>
                  <AccountPage />
                </RoleProtectedRoute>
              </RestaurantProtectedRoute>
            </AdminLayout>
          }
        />

      </Routes>
      </BrowserRouter>
    </LicenseProvider>
  );
}

export default App;
