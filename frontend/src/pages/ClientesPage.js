import { useEffect, useState } from "react";
import axios from "axios";

export default function ClientesPage() {
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });
  const [msg, setMsg] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editCliente, setEditCliente] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
  });

  const fetchClientes = () => {
    axios
      .get("http://localhost:5000/api/clientes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setClientes(res.data))
      .catch(() => setMsg("Error al cargar clientes ❌"));
  };

  useEffect(() => {
    fetchClientes();

    // Obtener el usuario actual
    axios
      .get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCurrentUser(res.data))
      .catch(() => setMsg("Error al cargar el usuario actual ❌"));
  }, [token]);

  const handleChange = (e) => {
    setNuevoCliente({
      ...nuevoCliente,
      [e.target.name]: e.target.value,
    });
  };

  const handleGuardarCliente = () => {
    axios
      .post("http://localhost:5000/api/clientes", nuevoCliente, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Cliente guardado ✅");
        setNuevoCliente({
          nombre: "",
          direccion: "",
          telefono: "",
          email: "",
        });
        fetchClientes();
      })
      .catch(() => setMsg("Error al guardar cliente ❌"));
  };

  const handleEliminar = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este cliente?")) {
      axios
        .delete(`http://localhost:5000/api/clientes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setMsg("Cliente eliminado ✅");
          fetchClientes();
        })
        .catch(() => setMsg("Error al eliminar cliente ❌"));
    }
  };

  const handleEditar = (cliente) => {
    setEditandoId(cliente._id);
    setEditCliente({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email,
    });
  };

  const handleGuardarEdicion = () => {
    axios
      .put(`http://localhost:5000/api/clientes/${editandoId}`, editCliente, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Cliente actualizado ✅");
        setEditandoId(null);
        fetchClientes();
      })
      .catch(() => setMsg("Error al actualizar cliente ❌"));
  };

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
      c.telefono.includes(clienteFiltro)
  );

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Directorio de Clientes</h1>
      {msg && <p className="mb-4 text-blue-600">{msg}</p>}

      {/* Formulario para nuevo cliente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          name="nombre"
          value={nuevoCliente.nombre}
          onChange={handleChange}
          placeholder="Nombre"
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="direccion"
          value={nuevoCliente.direccion}
          onChange={handleChange}
          placeholder="Dirección"
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="telefono"
          value={nuevoCliente.telefono}
          onChange={handleChange}
          placeholder="Teléfono"
          className="p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          value={nuevoCliente.email}
          onChange={handleChange}
          placeholder="Correo electrónico"
          className="p-2 border rounded"
        />
      </div>

      <button
        onClick={handleGuardarCliente}
        className="bg-green-600 text-white p-2 rounded mb-6"
      >
        Guardar Cliente
      </button>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          value={clienteFiltro}
          onChange={(e) => setClienteFiltro(e.target.value)}
          placeholder="Buscar por nombre o teléfono"
          className="p-2 border rounded w-full"
        />
      </div>

      {/* Tabla de clientes */}
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Dirección</th>
            <th className="p-2 border">Teléfono</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.map((cliente) => (
            <tr key={cliente._id}>
              <td className="p-2 border">
                {editandoId === cliente._id ? (
                  <input
                    type="text"
                    value={editCliente.nombre}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, nombre: e.target.value })
                    }
                    className="p-1 border rounded w-full"
                  />
                ) : (
                  cliente.nombre
                )}
              </td>
              <td className="p-2 border">
                {editandoId === cliente._id ? (
                  <input
                    type="text"
                    value={editCliente.direccion}
                    onChange={(e) =>
                      setEditCliente({
                        ...editCliente,
                        direccion: e.target.value,
                      })
                    }
                    className="p-1 border rounded w-full"
                  />
                ) : (
                  cliente.direccion
                )}
              </td>
              <td className="p-2 border">
                {editandoId === cliente._id ? (
                  <input
                    type="text"
                    value={editCliente.telefono}
                    onChange={(e) =>
                      setEditCliente({
                        ...editCliente,
                        telefono: e.target.value,
                      })
                    }
                    className="p-1 border rounded w-full"
                  />
                ) : (
                  cliente.telefono
                )}
              </td>
              <td className="p-2 border">
                {editandoId === cliente._id ? (
                  <input
                    type="email"
                    value={editCliente.email}
                    onChange={(e) =>
                      setEditCliente({ ...editCliente, email: e.target.value })
                    }
                    className="p-1 border rounded w-full"
                  />
                ) : (
                  cliente.email
                )}
              </td>
              <td className="p-2 border space-x-2">
                {editandoId === cliente._id ? (
                  <>
                    <button
                      onClick={handleGuardarEdicion}
                      className="text-green-600 underline text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="text-gray-600 underline text-sm"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    {currentUser?.role === "admin" && (
                        <button
                          onClick={() => handleEditar(cliente)}
                          className="text-blue-500 underline text-sm"
                        >
                          Editar
                        </button>
                      )}

                    {currentUser?.role === "admin" && (
                      <button
                        onClick={() => handleEliminar(cliente._id)}
                        className="text-red-500 underline text-sm"
                      >
                        Eliminar
                      </button>
                    )}

                    <button
                      onClick={() => {
                        localStorage.setItem(
                          "clienteSeleccionado",
                          cliente._id
                        );
                        window.location.href = "/admin/ventas";
                      }}
                      className="text-purple-600 underline text-sm"
                    >
                      Registrar Venta
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
