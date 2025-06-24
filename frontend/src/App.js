import { BrowserRouter, Routes, Route } from "react-router-dom";
import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import ReportPage from "./pages/ReportPage";
import AdminLayout from "./components/AdminLayout"; // ✅ Asegúrate de importar esto

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        <Route
          path="/admin/usuarios"
          element={
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          }
        />

        <Route
          path="/admin/productos"
          element={
            <AdminLayout>
              <ProductsPage />
            </AdminLayout>
          }
        />
        <Route 
        path="/admin/reportes" 
        element={<AdminLayout> 
          <ReportPage />
          </AdminLayout>} />

        <Route
          path="/admin/ventas"
          element={
            <AdminLayout>
              <SalesPage />
            </AdminLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
