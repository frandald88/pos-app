import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function TiendasPage() {
  const token = localStorage.getItem("token");
  const [tiendas, setTiendas] = useState([]);
  const [nuevaTienda, setNuevaTienda] = useState({ nombre: "", direccion: "", telefono: "" });
  const [msg, setMsg] = useState("");
  const [editTienda, setEditTienda] = useState(null);

  const fetchTiendas = () => {
    axios.get(`${apiBaseUrl}/api/tiendas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setTiendas(res.data))
    .catch(() => setMsg("Error al cargar tiendas ❌"));
  };

  useEffect(() => {
    fetchTiendas();
  }, []);

  const handleChange = (e) => {
    setNuevaTienda({ ...nuevaTienda, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios.post(`${apiBaseUrl}/api/tiendas`, nuevaTienda, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setMsg("Tienda guardada ✅");
      setNuevaTienda({ nombre: "", direccion: "", telefono: "" });
      fetchTiendas();
    })
    .catch(() => setMsg("Error al guardar tienda ❌"));
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Eliminar esta tienda?")) {
      axios.delete(`${apiBaseUrl}/api/tiendas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(fetchTiendas)
      .catch(() => setMsg("Error al eliminar tienda ❌"));
    }
  };

  const handleEdit = (tienda) => {
    setEditTienda(tienda);
    setNuevaTienda(tienda);
  };

  const handleUpdate = () => {
    axios.put(`${apiBaseUrl}/api/tiendas/${editTienda._id}`, nuevaTienda, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setMsg("Tienda actualizada ✅");
      setEditTienda(null);
      setNuevaTienda({ nombre: "", direccion: "", telefono: "" });
      fetchTiendas();
    })
    .catch(() => setMsg("Error al actualizar tienda ❌"));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Tiendas</h1>
      {msg && <p className="mb-4 text-blue-600">{msg}</p>}

      {/* Formulario */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input type="text" name="nombre" value={nuevaTienda.nombre} onChange={handleChange} placeholder="Nombre" className="p-2 border rounded" />
        <input type="text" name="direccion" value={nuevaTienda.direccion} onChange={handleChange} placeholder="Dirección" className="p-2 border rounded" />
        <input type="text" name="telefono" value={nuevaTienda.telefono} onChange={handleChange} placeholder="Teléfono" className="p-2 border rounded" />
      </div>

      {editTienda ? (
        <button onClick={handleUpdate} className="bg-blue-600 text-white p-2 rounded mb-6">Actualizar Tienda</button>
      ) : (
        <button onClick={handleSave} className="bg-green-600 text-white p-2 rounded mb-6">Guardar Tienda</button>
      )}

      {/* Tabla */}
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">Dirección</th>
            <th className="p-2 border">Teléfono</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tiendas.map((t) => (
            <tr key={t._id}>
              <td className="p-2 border">{t.nombre}</td>
              <td className="p-2 border">{t.direccion}</td>
              <td className="p-2 border">{t.telefono}</td>
              <td className="p-2 border">
                <button onClick={() => handleEdit(t)} className="text-blue-500 underline mr-2">Editar</button>
                <button onClick={() => handleDelete(t._id)} className="text-red-500 underline">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
