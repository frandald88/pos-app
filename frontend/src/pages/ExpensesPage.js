import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function ExpensesPage() {
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  const [concepto, setConcepto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [evidencia, setEvidencia] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroTienda, setFiltroTienda] = useState("");
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFin, setFiltroFin] = useState("");
  const [reportData, setReportData] = useState([]);
  const [editingGastoId, setEditingGastoId] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCurrentUser(res.data))
      .catch(() => setMsg("Error al cargar usuario ❌"))
      .finally(() => setUserLoaded(true));

    axios
      .get(`${apiBaseUrl}/api/tiendas`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setTiendas(res.data));
  }, [token]);

  useEffect(() => {
    if (userLoaded && currentUser?.role === "admin") {
      loadExpenses();
    }
  }, [userLoaded, currentUser]);

const loadExpenses = () => {
  axios
    .get(`${apiBaseUrl}/api/expenses/report`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        proveedor: filtroProveedor,
        metodoPago: filtroMetodoPago,
        tiendaId: filtroTienda,
        status: filtroEstado,
        startDate: filtroInicio,
        endDate: filtroFin,
      },
    })
    .then((res) => setReportData(res.data))
    .catch(() => setMsg("Error al cargar reporte ❌"));
};

  const handleGuardarGasto = () => {
    if (!concepto || !proveedor || !monto || !metodoPago || !tiendaSeleccionada) {
      setMsg("Completa todos los campos incluyendo tienda ❌");
      return;
    }

    const formData = new FormData();
    formData.append("concepto", concepto);
    formData.append("proveedor", proveedor);
    formData.append("monto", monto);
    formData.append("metodoPago", metodoPago);
    formData.append("tienda", tiendaSeleccionada);
    if (evidencia) formData.append("evidencia", evidencia);

    axios
      .post(`${apiBaseUrl}/api/expenses`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then(() => {
        setMsg("Gasto guardado ✅");
        setConcepto("");
        setProveedor("");
        setMonto("");
        setMetodoPago("efectivo");
        setEvidencia(null);
        if (currentUser?.role === "admin") loadExpenses();
      })
      .catch(() => setMsg("Error al guardar gasto ❌"));
  };

const saveStatus = (gastoId) => {
  if (!newStatus) {
    setMsg("Selecciona un estado válido ❌");
    return;
  }

  axios
    .patch(
      `${apiBaseUrl}/api/expenses/status/${gastoId}`,
      { status: newStatus, nota: adminNote },  // ✅ Cambiado adminNote → nota
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => {
      setMsg("Estado actualizado ✅");
      setEditingGastoId(null);
      setNewStatus("");
      setAdminNote("");
      loadExpenses();
    })
    .catch(() => setMsg("Error al actualizar estado ❌"));
};

  const handleDelete = (gastoId) => {
    axios
      .delete(`${apiBaseUrl}/api/expenses/${gastoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Gasto eliminado ✅");
        loadExpenses();
      })
      .catch(() => setMsg("Error al eliminar gasto ❌"));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Registro de Gastos</h2>

      {/* Formulario nuevo gasto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Concepto"
          className="p-2 border rounded"
        />
        <input
          type="text"
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          placeholder="Proveedor"
          className="p-2 border rounded"
        />
        <input
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto"
          className="p-2 border rounded"
        />
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="tarjeta">Tarjeta</option>
        </select>
        <select
          value={tiendaSeleccionada}
          onChange={(e) => setTiendaSeleccionada(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">-- Tienda --</option>
          {tiendas.map((t) => (
            <option key={t._id} value={t._id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <input
          type="file"
          onChange={(e) => setEvidencia(e.target.files[0])}
          className="p-2 border rounded"
        />
      </div>

      <button
        onClick={handleGuardarGasto}
        className="bg-green-600 text-white p-2 rounded"
      >
        Guardar Gasto
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 mt-6">
  <input
    type="text"
    value={filtroProveedor}
    onChange={(e) => setFiltroProveedor(e.target.value)}
    placeholder="Proveedor"
    className="p-2 border rounded"
  />

  <select
    value={filtroTienda}
    onChange={(e) => setFiltroTienda(e.target.value)}
    className="p-2 border rounded"
  >
    <option value="">Todas las tiendas</option>
    {tiendas.map((t) => (
      <option key={t._id} value={t._id}>{t.nombre}</option>
    ))}
  </select>

  <select
    value={filtroMetodoPago}
    onChange={(e) => setFiltroMetodoPago(e.target.value)}
    className="p-2 border rounded"
  >
    <option value="">Todos los métodos</option>
    <option value="efectivo">Efectivo</option>
    <option value="transferencia">Transferencia</option>
    <option value="tarjeta">Tarjeta</option>
  </select>

  <select
    value={filtroEstado}
    onChange={(e) => setFiltroEstado(e.target.value)}
    className="p-2 border rounded"
  >
    <option value="">Todos los estados</option>
    <option value="pendiente">Pendiente</option>
    <option value="aprobado">Aprobado</option>
    <option value="denegado">Denegado</option>
    <option value="en revisión">En revisión</option>
  </select>

  <input
    type="date"
    value={filtroInicio}
    onChange={(e) => setFiltroInicio(e.target.value)}
    className="p-2 border rounded"
  />
  <input
    type="date"
    value={filtroFin}
    onChange={(e) => setFiltroFin(e.target.value)}
    className="p-2 border rounded"
  />

  <button
    onClick={loadExpenses}
    className="bg-blue-600 text-white p-2 rounded col-span-full"
  >
    Filtrar Reporte
  </button>
</div>

      {/* Reporte solo admin */}
      {userLoaded && currentUser?.role === "admin" && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Reporte de Gastos</h3>
          <table className="min-w-full text-sm border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-2 py-1">Fecha</th>
                <th className="border px-2 py-1">Concepto</th>
                <th className="border px-2 py-1">Proveedor</th>
                <th className="border px-2 py-1">Monto</th>
                <th className="border px-2 py-1">Tienda</th>
                <th className="border px-2 py-1">Método</th>
                <th className="border px-2 py-1">Estado</th>
                <th className="border px-2 py-1">Nota</th>
                <th className="border px-2 py-1">Evidencia</th>
                <th className="border px-2 py-1">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((gasto) => (
                <tr key={gasto._id}>
                  <td className="border px-2 py-1">
                    {new Date(gasto.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1">{gasto.concepto}</td>
                  <td className="border px-2 py-1">{gasto.proveedor}</td>
                  <td className="border px-2 py-1">${gasto.monto}</td>
                  <td className="border px-2 py-1">{gasto.tienda?.nombre}</td>
                  <td className="border px-2 py-1">{gasto.metodoPago}</td>
                  <td className="border px-2 py-1">{gasto.status}</td>
                  <td className="border px-2 py-1">{gasto.nota || "-"}</td>
                  <td className="border px-2 py-1">
                    {gasto.evidencia && (
                      <a
                        href={`${apiBaseUrl}/api/expenses/evidencia/${gasto.evidencia}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline"
                      >
                        Ver
                      </a>
                    )}
                  </td>
                  <td className="border px-2 py-1 space-y-1">
                    {editingGastoId === gasto._id ? (
                      <div className="space-y-1">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full p-1 border rounded text-xs"
                        >
                          <option value="">-- Estado --</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="aprobado">Aprobado</option>
                          <option value="denegado">Denegado</option>
                          <option value="en revision">En revisión</option>
                        </select>
                        <input
                          type="text"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Nota (opcional)"
                          className="w-full p-1 border rounded text-xs"
                        />
                        <button
                          onClick={() => saveStatus(gasto._id)}
                          className="text-green-600 text-xs underline block"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingGastoId(null);
                            setNewStatus("");
                            setAdminNote("");
                          }}
                          className="text-gray-600 text-xs underline block"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingGastoId(gasto._id)}
                          className="text-blue-600 text-xs underline block"
                        >
                          Actualizar Estado
                        </button>

                        {(gasto.status === "aprobado" || gasto.status === "denegado") && (
                          <button
                            onClick={() => handleDelete(gasto._id)}
                            className="text-red-600 text-xs underline block"
                          >
                            Eliminar
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {msg && (
        <p className="mt-2 text-center text-sm font-semibold text-red-600">{msg}</p>
      )}
    </div>
  );
}
