import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function EmployeeHistoryPage() {
  const token = localStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [msg, setMsg] = useState("");

  // Formulario registro nuevo
  const [employeeId, setEmployeeId] = useState("");
  const [tiendaId, setTiendaId] = useState("");
  const [sueldoDiario, setSueldoDiario] = useState("");
  const [seguroSocial, setSeguroSocial] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [motivoBaja, setMotivoBaja] = useState("");
  const [razonBaja, setRazonBaja] = useState("");

  // Estado para edición
  const [editingId, setEditingId] = useState(null);
  const [editEndDate, setEditEndDate] = useState("");
  const [editSeguro, setEditSeguro] = useState(false);
  const [editMotivo, setEditMotivo] = useState("");
  const [editRazon, setEditRazon] = useState("");

  // Ranking
  const [ranking, setRanking] = useState([]);
  const [rankStartDate, setRankStartDate] = useState("");
  const [rankEndDate, setRankEndDate] = useState("");

  useEffect(() => {
    axios.get(`${apiBaseUrl}/api/users`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setUsers(res.data));
    axios.get(`${apiBaseUrl}/api/tiendas`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setTiendas(res.data));
    loadHistory();
  }, [token]);

  const loadHistory = () => {
    axios.get(`${apiBaseUrl}/api/employees/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHistoryData(res.data));
  };

  const handleGuardar = () => {
    if (!employeeId || !tiendaId || !sueldoDiario || !startDate) {
      setMsg("Completa todos los campos obligatorios ❌");
      return;
    }

    axios.post(`${apiBaseUrl}/api/employees/history`, {
      employee: employeeId,
      tienda: tiendaId,
      sueldoDiario,
      seguroSocial,
      startDate,
      endDate: endDate || null,
      motivoBaja,
      razonBaja
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setMsg("Historial guardado ✅");
        clearForm();
        loadHistory();
      })
      .catch(() => setMsg("Error al guardar ❌"));
  };

  const handleUpdate = (id) => {
    axios.put(`${apiBaseUrl}/api/employees/history/${id}`, {
      endDate: editEndDate || null,
      seguroSocial: editSeguro,
      motivoBaja: editMotivo,
      razonBaja: editRazon
    }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setMsg("Historial actualizado ✅");
        setEditingId(null);
        loadHistory();
      })
      .catch(() => setMsg("Error al actualizar ❌"));
  };

  const handleDelete = (id) => {
    axios.delete(`${apiBaseUrl}/api/employees/history/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setMsg("Historial eliminado ✅");
        loadHistory();
      })
      .catch(() => setMsg("Error al eliminar ❌"));
  };

  const loadRanking = () => {
    if (!rankStartDate || !rankEndDate) {
      setMsg("Selecciona rango de fechas para ranking ❌");
      return;
    }

    axios.get(`${apiBaseUrl}/api/employees/history/ranking/faltas`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        startDate: rankStartDate,
        endDate: rankEndDate
      }
    })
      .then(res => setRanking(res.data))
      .catch(() => setMsg("Error al cargar ranking ❌"));
  };

  const clearForm = () => {
    setEmployeeId("");
    setTiendaId("");
    setSueldoDiario("");
    setSeguroSocial(false);
    setStartDate("");
    setEndDate("");
    setMotivoBaja("");
    setRazonBaja("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Historial Laboral de Empleados</h2>

      {/* Formulario Nuevo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="p-2 border rounded">
          <option value="">-- Empleado --</option>
          {users.map(u => (
            <option key={u._id} value={u._id}>{u.username}</option>
          ))}
        </select>

        <select value={tiendaId} onChange={(e) => setTiendaId(e.target.value)} className="p-2 border rounded">
          <option value="">-- Tienda --</option>
          {tiendas.map(t => (
            <option key={t._id} value={t._id}>{t.nombre}</option>
          ))}
        </select>

        <input type="number" value={sueldoDiario} onChange={(e) => setSueldoDiario(e.target.value)} placeholder="Sueldo Diario" className="p-2 border rounded" />

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={seguroSocial} onChange={(e) => setSeguroSocial(e.target.checked)} />
          Seguro Social
        </label>

        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border rounded" placeholder="Fecha de Ingreso" />

        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border rounded" placeholder="Fecha de Baja (opcional)" />

        <select value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} className="p-2 border rounded">
          <option value="">-- Motivo de salida --</option>
          <option value="renuncia">Renuncia</option>
          <option value="despido">Despido</option>
        </select>

        <input type="text" value={razonBaja} onChange={(e) => setRazonBaja(e.target.value)} placeholder="Razón de salida (opcional)" className="p-2 border rounded" />
      </div>

      <button onClick={handleGuardar} className="bg-green-600 text-white p-2 rounded mb-6">Guardar Historial</button>

      {/* Tabla */}
      <table className="min-w-full text-sm border mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Empleado</th>
            <th className="border px-2 py-1">Tienda</th>
            <th className="border px-2 py-1">Sueldo Diario</th>
            <th className="border px-2 py-1">Seguro</th>
            <th className="border px-2 py-1">Ingreso</th>
            <th className="border px-2 py-1">Salida</th>
            <th className="border px-2 py-1">Motivo</th>
            <th className="border px-2 py-1">Razón</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {historyData.map(h => (
            <tr key={h._id}>
              <td className="border px-2 py-1">{h.employee.username}</td>
              <td className="border px-2 py-1">{h.tienda?.nombre}</td>
              <td className="border px-2 py-1">${h.sueldoDiario}</td>
              <td className="border px-2 py-1">{h.seguroSocial ? "Sí" : "No"}</td>
              <td className="border px-2 py-1">{new Date(h.startDate).toLocaleDateString()}</td>
              <td className="border px-2 py-1">{h.endDate ? new Date(h.endDate).toLocaleDateString() : "-"}</td>
              <td className="border px-2 py-1">{h.motivoBaja || "-"}</td>
              <td className="border px-2 py-1">{h.razonBaja || "-"}</td>
              <td className="border px-2 py-1 space-y-1">
                {editingId === h._id ? (
                  <div className="space-y-1">
                    <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="Fecha de salida" />
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={editSeguro} onChange={(e) => setEditSeguro(e.target.checked)} />
                      Seguro
                    </label>
                    <select value={editMotivo} onChange={(e) => setEditMotivo(e.target.value)} className="w-full p-1 border rounded text-xs">
                      <option value="">-- Motivo --</option>
                      <option value="renuncia">Renuncia</option>
                      <option value="despido">Despido</option>
                    </select>
                    <input type="text" value={editRazon} onChange={(e) => setEditRazon(e.target.value)} placeholder="Razón" className="w-full p-1 border rounded text-xs" />
                    <button onClick={() => handleUpdate(h._id)} className="text-green-600 text-xs underline block">Guardar</button>
                    <button onClick={() => setEditingId(null)} className="text-gray-600 text-xs underline block">Cancelar</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => {
                      setEditingId(h._id);
                      setEditEndDate(h.endDate ? h.endDate.split('T')[0] : "");
                      setEditSeguro(h.seguroSocial);
                      setEditMotivo(h.motivoBaja || "");
                      setEditRazon(h.razonBaja || "");
                    }} className="text-blue-600 text-xs underline block">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(h._id)} className="text-red-600 text-xs underline block">
                      Eliminar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ranking */}
      <h3 className="text-lg font-semibold mt-6 mb-2">Ranking de Menos Faltas</h3>
      <div className="flex gap-2 mb-2">
        <input type="date" value={rankStartDate} onChange={(e) => setRankStartDate(e.target.value)} className="p-2 border rounded text-sm" />
        <input type="date" value={rankEndDate} onChange={(e) => setRankEndDate(e.target.value)} className="p-2 border rounded text-sm" />
        <button onClick={loadRanking} className="bg-blue-600 text-white px-4 py-1 rounded text-sm">Generar Ranking</button>
      </div>

      {ranking.length > 0 && (
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Empleado</th>
              <th className="border px-2 py-1">Faltas</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1">{r.empleado}</td>
                <td className="border px-2 py-1">{r.faltas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {msg && <p className="mt-2 text-center text-sm font-semibold text-red-600">{msg}</p>}
    </div>
  );
}
