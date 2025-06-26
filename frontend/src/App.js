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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Usuarios - Solo admin */}
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

        {/* Productos - Solo admin */}
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

        {/* Reportes - Solo admin */}
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

        {/* Ventas - Visible para todos */}
        <Route
          path="/admin/ventas"
          element={
            <AdminLayout>
              <SalesPage />
            </AdminLayout>
          }
        />

        {/* Clientes - Visible para todos */}
        <Route
          path="/admin/clientes"
          element={
            <AdminLayout>
              <ClientesPage />
            </AdminLayout>
          }
        />

        {/* Empleados - Visible para todos */}
        <Route
          path="/admin/empleados"
          element={
            <AdminLayout>
              <EmployeesPage />
            </AdminLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
