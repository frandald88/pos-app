import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    proveedor: "",
    producto: "",
    cantidad: "",
    unidad: "pza",
    fechaEmision: "",
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editFechaEntrega, setEditFechaEntrega] = useState("");
  const [editNota, setEditNota] = useState("");

  const token = localStorage.getItem("token");

  const fetchOrders = () => {
    axios
      .get(`${apiBaseUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setOrders(res.data))
      .catch(() => setMsg("Error al cargar órdenes ❌"));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    axios
      .post(`${apiBaseUrl}/api/orders`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Orden creada ✅");
        setForm({ proveedor: "", producto: "", cantidad: "", unidad: "pza", fechaEmision: "" });
        fetchOrders();
      })
      .catch(() => setMsg("Error al crear orden ❌"));
  };

  const handleUpdate = () => {
    axios
      .put(`${apiBaseUrl}/api/orders/${editingOrder._id}`, {
        status: editStatus,
        fechaEntrega: editFechaEntrega,
        nota: editNota,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Orden actualizada ✅");
        setEditingOrder(null);
        setEditStatus("");
        setEditFechaEntrega("");
        setEditNota("");
        fetchOrders();
      })
      .catch(() => setMsg("Error al actualizar orden ❌"));
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Eliminar esta orden?")) {
      axios
        .delete(`${apiBaseUrl}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(() => {
          setMsg("Orden eliminada ✅");
          fetchOrders();
        })
        .catch(() => setMsg("Error al eliminar orden ❌"));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Órdenes de Compra</h1>
      {msg && <p className="mb-4 text-blue-600">{msg}</p>}

      {/* Formulario para crear orden */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <input
          type="text"
          name="proveedor"
          value={form.proveedor}
          onChange={handleChange}
          placeholder="Proveedor"
          className="p-2 border rounded"
        />
        <input
          type="text"
          name="producto"
          value={form.producto}
          onChange={handleChange}
          placeholder="Producto"
          className="p-2 border rounded"
        />
        <input
          type="number"
          name="cantidad"
          value={form.cantidad}
          onChange={handleChange}
          placeholder="Cantidad"
          className="p-2 border rounded"
        />
        <select
          name="unidad"
          value={form.unidad}
          onChange={handleChange}
          className="p-2 border rounded"
        >
          <option value="pza">Pza</option>
          <option value="kg">Kg</option>
          <option value="lts">Lts</option>
          <option value="mxn">$MXN</option>
        </select>
        <input
          type="date"
          name="fechaEmision"
          value={form.fechaEmision}
          onChange={handleChange}
          placeholder="Fecha de emisión"
          className="p-2 border rounded"
        />
      </div>

      <button
        onClick={handleSave}
        className="bg-green-600 text-white px-4 py-2 rounded mb-6"
      >
        Crear Orden
      </button>

      {/* Tabla de órdenes */}
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Proveedor</th>
            <th className="p-2 border">Producto</th>
            <th className="p-2 border">Cantidad</th>
            <th className="p-2 border">Fecha de emisión</th>
            <th className="p-2 border">Fecha de entrega</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Nota</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td className="p-2 border">{o.proveedor}</td>
              <td className="p-2 border">{o.producto}</td>
              <td className="p-2 border">
                {o.cantidad} {o.unidad}
              </td>
              <td className="p-2 border">
                {o.fechaEmision ? new Date(o.fechaEmision).toLocaleDateString() : "-"}
              </td>
              <td className="p-2 border">
                {o.fechaEntrega ? new Date(o.fechaEntrega).toLocaleDateString() : "-"}
              </td>
              <td className="p-2 border">{o.status}</td>
              <td className="p-2 border">{o.nota || "-"}</td>
              <td className="p-2 border">
                <button
                  onClick={() => {
                    setEditingOrder(o);
                    setEditStatus(o.status);
                    setEditFechaEntrega(o.fechaEntrega ? o.fechaEntrega.substring(0, 10) : "");
                    setEditNota(o.nota || "");
                  }}
                  className="text-blue-600 underline mr-2"
                >
                  Actualizar Orden
                </button>
                {(o.status === "completada" || o.status === "cancelada") && (
                  <button
                    onClick={() => handleDelete(o._id)}
                    className="text-red-600 underline"
                  >
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Formulario de actualización */}
      {editingOrder && (
        <div className="mt-6 p-4 border rounded bg-gray-100">
          <h3 className="text-md font-bold mb-2">Actualizar Orden</h3>
          <label>Status:</label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            className="p-2 border rounded w-full mb-2"
          >
            <option value="pendiente">Pendiente</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <label>Fecha de Entrega:</label>
          <input
            type="date"
            value={editFechaEntrega}
            onChange={(e) => setEditFechaEntrega(e.target.value)}
            className="p-2 border rounded w-full mb-2"
          />

          <label>Nota:</label>
          <textarea
            value={editNota}
            onChange={(e) => setEditNota(e.target.value)}
            className="p-2 border rounded w-full mb-2"
            placeholder="Ej. Se canceló por falta de stock"
          />

          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Guardar cambios
          </button>
          <button
            onClick={() => setEditingOrder(null)}
            className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
