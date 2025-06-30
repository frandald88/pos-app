import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function CajaPage() {
  const token = localStorage.getItem("token");

  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [resultados, setResultados] = useState(null);
  const [msg, setMsg] = useState("");

  const generarRangoFechas = () => {
    const ahora = new Date();
    let inicio, fin;

    if (periodo === "dia") {
      inicio = new Date(ahora.setHours(0, 0, 0, 0));
      fin = new Date();
    } else if (periodo === "mes") {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      fin = new Date();
    } else if (periodo === "año") {
      inicio = new Date(ahora.getFullYear(), 0, 1);
      fin = new Date();
    }

    setFechaInicio(inicio.toISOString().slice(0, 16));
    setFechaFin(fin.toISOString().slice(0, 16));
  };

  useEffect(() => {
    if (periodo !== "rango") generarRangoFechas();
  }, [periodo]);

  const formatDate = (isoString) => isoString ? isoString.slice(0, 10) : "";

const handleGenerarCorte = () => {
  if (!fechaInicio || !fechaFin) {
    setMsg("Debes seleccionar fechas válidas");
    return;
  }

  axios
    .get(`${apiBaseUrl}/api/caja/reporte`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate: formatDate(fechaInicio), endDate: formatDate(fechaFin) },
    })
    .then((res) => {
      setResultados(res.data);
      setMsg("Corte generado ✅");
    })
    .catch((error) => {
      console.error('Error al generar corte:', error);
      setMsg("Error al generar corte ❌");
    });
};

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Corte de Caja</h1>

      {msg && <p className="mb-2 text-sm text-blue-600">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="dia">Hoy</option>
          <option value="mes">Este mes</option>
          <option value="año">Este año</option>
          <option value="rango">Rango personalizado</option>
        </select>

        {periodo === "rango" && (
          <>
            <input
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="p-2 border rounded"
            />
            <input
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="p-2 border rounded"
            />
          </>
        )}
      </div>

      <button
        onClick={handleGenerarCorte}
        className="bg-green-600 text-white p-2 rounded"
      >
        Generar Corte
      </button>

      {resultados && (
        <div className="mt-6 text-lg space-y-2">
            <div>Total Ventas: ${Number(resultados.totalVentas || 0).toFixed(2)}</div>
            <div>Total Gastos: ${Number(resultados.totalGastos || 0).toFixed(2)}</div>
            <div>Total Devoluciones: ${Number(resultados.totalDevoluciones || 0).toFixed(2)}</div>
            <div className="font-bold">
            Total Final: ${Number(resultados.totalFinal || 0).toFixed(2)}
            </div>
        </div>
      )}
    </div>
  );
}
