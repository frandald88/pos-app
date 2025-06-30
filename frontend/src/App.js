import { BrowserRouter, Routes, Route } from "react-router-dom";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import ReportPage from "./pages/ReportPage";
import AdminLayout from "./components/AdminLayout";
import ClientesPage from "./pages/ClientesPage";
import EmployeesPage from "./pages/EmployeesPage";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import ExpensesPage from "./pages/ExpensesPage";
import TiendasPage from "./pages/TiendasPage";
import OrdersPage from "./pages/OrdersPage";
import EmployeeHistoryPage from "./pages/EmployeeHistoryPage";  // ✅ Nuevo
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ReturnsPage from "./pages/ReturnsPage";
import CajaPage from "./pages/CajaPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/admin/tiendas"
          element={
            <AdminLayout> 
              <TiendasPage />
            </AdminLayout>
          }
        />

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

        <Route
          path="/admin/devoluciones"
          element={
            <AdminLayout>
              <ReturnsPage />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/reportes"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <ReportPage />
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

        <Route
          path="/admin/ventas"
          element={
            <AdminLayout>
              <SalesPage />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/clientes"
          element={
            <AdminLayout>
              <ClientesPage />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/empleados"
          element={
            <AdminLayout>
              <EmployeesPage />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/gastos"
          element={
            <AdminLayout>
              <ExpensesPage />
            </AdminLayout>
          }
        />

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

        {/* ✅ Nueva Ruta para Historial de Empleados */}
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

            <Route
          path="/admin/caja"
          element={
            <AdminLayout>
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <CajaPage/>
              </RoleProtectedRoute>
            </AdminLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
