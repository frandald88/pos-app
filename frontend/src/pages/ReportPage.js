import { useEffect, useState } from "react";
import axios from "axios";

export default function ReportsPage() {
  const token = localStorage.getItem("token");

  const [ventas, setVentas] = useState([]);
  const [tipoVenta, setTipoVenta] = useState("");
  const [tipo, setTipo] = useState(""); // nuevo filtro
  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [msg, setMsg] = useState("");

  const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
  const ivaTotalGlobal = ventas.reduce((sum, v) => sum + v.ivaTotal, 0);

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
            tipo, // nuevo parámetro
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

      <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Tipo de Venta</label>
         <select
         value={tipo}
         onChange={(e) => setTipo(e.target.value)}
         className="p-2 border rounded"
          >
         <option value="">Todos</option>
         <option value="mostrador">Mostrador</option>
         <option value="recoger">A Recoger</option>
         <option value="domicilio">A Domicilio</option>
          </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Método de Pago</label>
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
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Periodo</label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="dia">Hoy</option>
            <option value="mes">Este mes</option>
            <option value="año">Este año</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleGenerar}
            className="bg-green-600 text-white p-2 rounded w-full"
          >
            Generar Reporte
          </button>
        </div>
      </div>

      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Id de Venta</th>
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Tipo de Venta</th>
            <th className="p-2 border">Metodo de Pago</th>
            <th className="p-2 border">Productos</th>
            <th className="p-2 border">IVA</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">Repartidor</th>
            <th className="p-2 border">Cliente</th>
          </tr>
        </thead>
        <tbody>
          {ventas.map((venta) => (
            <tr key={venta._id}>
              <td className="p-2 border">{venta._id}</td>
              <td className="p-2 border">{new Date(venta.date).toLocaleString()}</td>
              <td className="p-2 border">{venta.user?.username}</td>
              <td className="p-2 border">{venta.type}</td>
              <td className="p-2 border">{venta.method}</td>
              <td className="p-2 border">
                {venta.productos.map((p, i) => (
                  <div key={i} className="mb-1">
                    {p.nombre} - {p.cantidad} x ${p.precioUnitario} = ${p.subtotal.toFixed(2)}
                  </div>
                ))}
              </td>
              <td className="p-2 border">${venta.ivaTotal.toFixed(2)}</td>
              <td className="p-2 border">${venta.total.toFixed(2)}</td>
              <td className="p-2 border">{venta.repartidor?.username || "-"}</td>
              <td className="p-2 border">{venta.cliente?.nombre || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {ventas.length > 0 && (
        <div className="mt-4 text-right pr-4 font-bold text-lg space-y-2">
          <div>Total de ventas: ${totalVentas.toFixed(2)}</div>
          <div>Total de IVA pagado: ${ivaTotalGlobal.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}
