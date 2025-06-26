import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import logo from "../assets/logo.png";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentUser(res.data))
      .catch(() => {});
  }, [token]);

  const linkStyle = (path) =>
    location.pathname === path
      ? "bg-[#46546b] text-white"
      : "hover:bg-[#46546b] text-[#f4f6fa]";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-posnav text-postext border-r p-4">
        <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-6"></h2>
        <nav className="flex flex-col gap-2">
          {/* Usuarios - Solo admin */}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin/usuarios"
              className={`p-2 rounded ${linkStyle("/admin/usuarios")}`}
            >
              Usuarios
            </Link>
          )}

          {/* Productos - Solo admin */}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin/productos"
              className={`p-2 rounded ${linkStyle("/admin/productos")}`}
            >
              Productos
            </Link>
          )}

          {/* Clientes - Visible para todos */}
          <Link
            to="/admin/clientes"
            className={`p-2 rounded ${linkStyle("/admin/clientes")}`}
          >
            Clientes
          </Link>

          {/* Ventas - Visible para todos */}
          <Link
            to="/admin/ventas"
            className={`p-2 rounded ${linkStyle("/admin/ventas")}`}
          >
            Ventas
          </Link>

          {/* Reportes - Solo admin */}
          {currentUser?.role === "admin" && (
            <Link
              to="/admin/reportes"
              className={`p-2 rounded ${linkStyle("/admin/reportes")}`}
            >
              Reportes
            </Link>
          )}

          {/* Empleados - Visible para todos */}
          <Link
            to="/admin/empleados"
            className={`p-2 rounded ${linkStyle("/admin/empleados")}`}
          >
            Empleados
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded bg-red-500 text-white mt-4"
          >
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">{children}</main>
    </div>
  );
}
