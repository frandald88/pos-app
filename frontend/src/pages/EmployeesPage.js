import { useEffect, useState } from "react";
import axios from "axios";

export default function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportUser, setReportUser] = useState("");
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    // Cargar usuario actual
    axios
      .get("http://localhost:5000/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCurrentUser(res.data);
        setSelectedUser(res.data._id);
      })
      .catch(() => setMsg("Error al cargar el usuario actual ❌"));

    // Cargar lista de usuarios
    axios
      .get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const filtered = res.data.filter(
          (u) => u.role === "vendedor" || u.role === "repartidor"
        );
        setUsers(filtered);
      })
      .catch(() => setMsg("Error al cargar empleados ❌"));
  }, [token]);

  const handleCheckIn = () => {
    if (!selectedUser) {
      setMsg("Selecciona un empleado primero ❌");
      return;
    }
    axios
      .post(
        "http://localhost:5000/api/attendance/checkin",
        { userId: selectedUser },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => setMsg("Check-in exitoso ✅"))
      .catch(() => setMsg("Error al hacer check-in ❌"));
  };

  const handleCheckOut = () => {
    if (!selectedUser) {
      setMsg("Selecciona un empleado primero ❌");
      return;
    }
    axios
      .post(
        "http://localhost:5000/api/attendance/checkout",
        { userId: selectedUser },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => setMsg("Check-out exitoso ✅"))
      .catch(() => setMsg("Error al hacer check-out ❌"));
  };

  const handleAbsence = () => {
    if (!selectedUser || !absenceReason.trim()) {
      setMsg("Selecciona un empleado y proporciona una razón de ausencia ❌");
      return;
    }
    axios
      .post(
        "http://localhost:5000/api/attendance/absence",
        { userId: selectedUser, reason: absenceReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setMsg("Falta registrada ✅");
        setAbsenceReason("");
      })
      .catch(() => setMsg("Error al registrar falta ❌"));
  };

  const loadAttendanceReport = () => {
    if (!reportStartDate || !reportEndDate) {
      setMsg("Debes seleccionar una fecha de inicio y fin para el reporte ❌");
      return;
    }

    axios
      .get("http://localhost:5000/api/attendance/report", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          userId: reportUser,
          startDate: reportStartDate,
          endDate: reportEndDate,
        },
      })
      .then((res) => setReportData(res.data))
      .catch(() => setMsg("Error al cargar el reporte ❌"));
  };

  const visibleUsers =
    currentUser?.role === "admin"
      ? users
      : users.filter((u) => u._id === currentUser?._id);

  return (
    <div className="p-4 w-full">
      <h2 className="text-xl font-bold mb-4">Registro de Asistencia de Empleados</h2>

      {/* Selector de empleado */}
      <label className="block mb-1">Empleado</label>
      <select
        value={selectedUser}
        onChange={(e) => setSelectedUser(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        disabled={currentUser?.role !== "admin"}
      >
        <option value="">-- Selecciona un empleado --</option>
        {visibleUsers.map((u) => (
          <option key={u._id} value={u._id}>
            {u.username} ({u.role})
          </option>
        ))}
      </select>

      {/* Botones de Check-in y Check-out */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleCheckIn}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Check-in
        </button>
        <button
          onClick={handleCheckOut}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Check-out
        </button>
      </div>

      {/* Registro de falta */}
      {currentUser?.role === "admin" && (
        <div className="mb-6">
          <label className="block mb-1">Motivo de falta</label>
          <textarea
            value={absenceReason}
            onChange={(e) => setAbsenceReason(e.target.value)}
            placeholder="Ej. Enfermedad, permiso, etc."
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleAbsence}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded w-full"
          >
            Registrar Falta
          </button>
        </div>
      )}

      {/* Reporte de asistencia */}
{currentUser?.role === "admin" && (
  <div className="mt-6 border-t pt-4 w-full">
    <h3 className="text-lg font-semibold mb-2">Reporte de Asistencia</h3>

    {/* Filtros */}
    <div className="mb-4">
      <label className="block text-sm">Empleado (opcional)</label>
      <select
        value={reportUser}
        onChange={(e) => setReportUser(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      >
        <option value="">-- Todos --</option>
        {users.map((u) => (
          <option key={u._id} value={u._id}>
            {u.username} ({u.role})
          </option>
        ))}
      </select>

      <label className="block text-sm">Fecha inicio</label>
      <input
        type="date"
        value={reportStartDate}
        onChange={(e) => setReportStartDate(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />

      <label className="block text-sm">Fecha fin</label>
      <input
        type="date"
        value={reportEndDate}
        onChange={(e) => setReportEndDate(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />

      <button
        onClick={loadAttendanceReport}
        className="bg-gray-700 text-white px-4 py-2 rounded w-full"
      >
        Ver Reporte
      </button>
    </div>

    {/* Tabla de resultados */}
    {reportData.length > 0 && (
      <div className="w-full overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-2 py-1">Empleado</th>
              <th className="border px-2 py-1">Fecha</th>
              <th className="border px-2 py-1">Hora Entrada</th>
              <th className="border px-2 py-1">Hora Salida</th>
              <th className="border px-2 py-1">Ausencia</th>
              <th className="border px-2 py-1">Nota</th>
              <th className="border px-2 py-1">Horas Trabajadas</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((r) => (
              <tr key={r._id}>
                <td className="border px-2 py-1">{r.userId.username}</td>
                <td className="border px-2 py-1">
                  {new Date(r.date).toLocaleDateString()}
                </td>
                <td className="border px-2 py-1">
                  {r.checkInTime
                    ? new Date(r.checkInTime).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="border px-2 py-1">
                  {r.checkOutTime
                    ? new Date(r.checkOutTime).toLocaleTimeString()
                    : "-"}
                </td>
                <td className="border px-2 py-1">
                  {r.status === "Absent" ? "Sí" : "No"}
                </td>
                <td className="border px-2 py-1">{r.absenceReason || "-"}</td>
                <td className="border px-2 py-1">
                  {r.checkInTime && r.checkOutTime
                    ? (() => {
                        const diffMs =
                          new Date(r.checkOutTime) - new Date(r.checkInTime);
                        const hours = Math.floor(diffMs / (1000 * 60 * 60));
                        const minutes = Math.floor(
                          (diffMs % (1000 * 60 * 60)) / (1000 * 60)
                        );
                        return `${hours}h ${minutes}m`;
                      })()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}


      {/* Mensajes */}
      {msg && (
        <p className="mt-2 text-center text-sm font-semibold text-red-600">
          {msg}
        </p>
      )}
    </div>
  );
}
