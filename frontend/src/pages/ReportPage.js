import { useEffect, useState } from "react";
import axios from "axios";

export default function ReportsPage() {
  const token = localStorage.getItem("token");

  const [ventas, setVentas] = useState([]);
  const [tipoVenta, setTipoVenta] = useState("");
  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [msg, setMsg] = useState("");
  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);


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

    setFechaInicio(inicio.toISOString());
    setFechaFin(fin.toISOString());
  };

  useEffect(() => {
    generarRangoFechas();
  }, [periodo]);

  const handleGenerar = () => {
    axios
      .get("http://localhost:5000/api/report/ventas", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          tipoVenta,
          inicio: fechaInicio,
          fin: fechaFin,
        },
      })
      .then((res) => {
        setVentas(res.data);
        setMsg("Reporte generado ✅");
      })
      .catch(() => setMsg("Error al generar reporte ❌"));
  };

  

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Reporte de Ventas</h1>
      {msg && <p className="mb-4 text-sm text-blue-600">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={tipoVenta}
          onChange={(e) => setTipoVenta(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">Todos</option>
          <option value="efectivo">Solo efectivo</option>
          <option value="transferencia">Solo transferencia</option>
          <option value="tarjeta">Solo tarjeta</option>
        </select>

        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="dia">Hoy</option>
          <option value="mes">Este mes</option>
          <option value="año">Este año</option>
        </select>

        <button onClick={handleGenerar} className="bg-green-600 text-white p-2 rounded">
          Generar Reporte
        </button>
      </div>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Tipo de venta</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <tr key={venta._id}>
              <td className="p-2 border">{new Date(venta.date).toLocaleString()}</td>
              <td className="p-2 border">{venta.user?.username}</td>
              <td className="p-2 border">{venta.method}</td>
              <td className="p-2 border">${venta.total.toFixed(2)}</td>
            </tr>
          ))}

          

        </tbody>
      </table>
      {ventas.length > 0 && (
             <div className="mt-4 text-right pr-4 font-bold text-lg">
              Total de ventas: ${totalVentas.toFixed(2)}
             </div>
            )}
    </div>
  );
}
