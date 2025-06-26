import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { saveAs } from "file-saver";
import Papa from "papaparse";

export default function ReportsPage() {
  const token = localStorage.getItem("token");

  const [ventas, setVentas] = useState([]);
  const [tipoVenta, setTipoVenta] = useState("");
  const [tipo, setTipo] = useState("");
  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [msg, setMsg] = useState("");
  const [productoFiltro, setProductoFiltro] = useState("");
  const [visibleRows, setVisibleRows] = useState(10);
  const [showGraph, setShowGraph] = useState(false);

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
    } else if (periodo === "rango") {
      return; // No tocar fechas si es rango manual
    }

    setFechaInicio(inicio.toISOString().slice(0, 16));
    setFechaFin(fin.toISOString().slice(0, 16));
  };

  useEffect(() => {
    generarRangoFechas();
  }, [periodo]);

  const handleGenerar = () => {
    setVisibleRows(10);
    setShowGraph(false);

    axios
      .get("http://localhost:5000/api/report/ventas", {
        headers: { Authorization: `Bearer ${token}` },
        params: { tipoVenta, tipo, inicio: fechaInicio, fin: fechaFin },
      })
      .then((res) => {
        setVentas(res.data);
        setMsg("Reporte generado ✅");
      })
      .catch(() => setMsg("Error al generar reporte ❌"));
  };

  const ventasFiltradas = ventas.filter((v) => {
    const nombre = v.producto?.toLowerCase() || "";
    const sku = v.sku?.toString() || "";
    const filtro = productoFiltro.toLowerCase();
    return nombre.includes(filtro) || sku.includes(filtro);
  });

  const totalGeneral = ventasFiltradas.reduce((sum, v) => sum + v.totalProducto, 0);
  const ivaTotal = ventasFiltradas.reduce((sum, v) => sum + v.ivaProducto, 0);

  const generarDatosGrafica = () => {
    const agrupados = {};

    ventasFiltradas.forEach((venta) => {
      let key = "";
      const fecha = new Date(venta.date);

      if (periodo === "dia") {
        key = fecha.getHours() + ":00";
      } else if (periodo === "mes") {
        key = fecha.getDate().toString();
      } else if (periodo === "año") {
        key = (fecha.getMonth() + 1) + "/" + fecha.getDate();
      }

      if (!agrupados[key]) agrupados[key] = 0;
      agrupados[key] += venta.totalProducto;
    });

    return Object.keys(agrupados).map((key) => ({
      label: key,
      total: agrupados[key],
    }));
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(ventasFiltradas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "reporte_ventas.csv");
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Reporte de Ventas</h1>
      {msg && <p className="mb-4 text-sm text-blue-600">{msg}</p>}

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Tipo de Venta */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Tipo de Venta</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="p-2 border rounded">
            <option value="">Todos</option>
            <option value="mostrador">Mostrador</option>
            <option value="recoger">A Recoger</option>
            <option value="domicilio">A Domicilio</option>
          </select>
        </div>

        {/* Método de pago */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Método de Pago</label>
          <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value)} className="p-2 border rounded">
            <option value="">Todos</option>
            <option value="efectivo">Solo efectivo</option>
            <option value="transferencia">Solo transferencia</option>
            <option value="tarjeta">Solo tarjeta</option>
          </select>
        </div>

        {/* Periodo */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Periodo</label>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="p-2 border rounded">
            <option value="dia">Hoy</option>
            <option value="mes">Este mes</option>
            <option value="año">Este año</option>
            <option value="rango">Rango personalizado</option>
          </select>
        </div>

        {/* Producto o SKU */}
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Buscar Producto o SKU</label>
          <input
            type="text"
            value={productoFiltro}
            onChange={(e) => setProductoFiltro(e.target.value)}
            placeholder="Ej: Carnivora o 5544"
            className="p-2 border rounded"
          />
        </div>
      </div>

      {periodo === "rango" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-semibold mb-1">Fecha Inicio</label>
            <input
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1">Fecha Fin</label>
            <input
              type="datetime-local"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex space-x-2 mb-4">
        <button onClick={handleGenerar} className="bg-green-600 text-white p-2 rounded">
          Generar Reporte
        </button>
        {ventasFiltradas.length > 0 && (
          <>
            <button onClick={() => setShowGraph(true)} className="bg-purple-600 text-white p-2 rounded">
              Generar Gráfico
            </button>
            <button onClick={handleExportCSV} className="bg-yellow-500 text-white p-2 rounded">
              Descargar CSV
            </button>
          </>
        )}
      </div>

                {/* Tabla */}
          <table className="table-auto w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Id de Venta</th>
                <th className="p-2 border">Fecha</th>
                <th className="p-2 border">Usuario</th>
                <th className="p-2 border">Tipo de Venta</th>
                <th className="p-2 border">Método de Pago</th>
                <th className="p-2 border">Producto</th>
                <th className="p-2 border">SKU</th>
                <th className="p-2 border">Cantidad</th>
                <th className="p-2 border">Precio Neto Unitario</th>
                <th className="p-2 border">Subtotal</th>
                <th className="p-2 border">IVA Producto</th>
                <th className="p-2 border">Total por Producto</th>
                <th className="p-2 border">Total de la Venta Completa</th>
                <th className="p-2 border">Descuento ($)</th>
                <th className="p-2 border">% Descuento</th>
                <th className="p-2 border">Repartidor</th>
                <th className="p-2 border">Cliente</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas
                .slice(0, ventasFiltradas.length <= 10 ? ventasFiltradas.length : visibleRows)
                .map((venta, index) => (
                  <tr key={index}>
                    <td className="p-2 border">{venta.ventaId}</td>
                    <td className="p-2 border">{new Date(venta.date).toLocaleString()}</td>
                    <td className="p-2 border">{venta.user}</td>
                    <td className="p-2 border">{venta.type}</td>
                    <td className="p-2 border">{venta.method}</td>
                    <td className="p-2 border">{venta.producto}</td>
                    <td className="p-2 border">{venta.sku}</td>
                    <td className="p-2 border">{venta.cantidad}</td>
                    <td className="p-2 border">${venta.precioUnitario.toFixed(2)}</td>
                    <td className="p-2 border">${venta.subtotal.toFixed(2)}</td>
                    <td className="p-2 border">${venta.ivaProducto.toFixed(2)}</td>
                    <td className="p-2 border">${venta.totalProducto.toFixed(2)}</td>
                    <td className="p-2 border">${Number(venta.totalVenta).toFixed(2)}</td>
                    <td className="p-2 border">{Number(venta.descuento ?? 0).toFixed(2) !== "0.00" ? `$${Number(venta.descuento ?? 0).toFixed(2)}` : "-"}</td>
                    <td className="p-2 border">{Number(venta.porcentajeDescuento ?? 0).toFixed(2) !== "0.00" ? `${Number(venta.porcentajeDescuento ?? 0).toFixed(2)}%` : "-"}</td>
                    <td className="p-2 border">{venta.repartidor}</td>
                    <td className="p-2 border">{venta.cliente}</td>
                  </tr>
              ))}
            </tbody>
          </table>


          {ventasFiltradas.length > visibleRows && (
            <button
              onClick={() => setVisibleRows(visibleRows + 10)}
              className="mt-2 p-2 bg-blue-500 text-white rounded"
            >
              Cargar más
            </button>
          )}

      {ventasFiltradas.length > 0 && (
        <div className="mt-4 text-right pr-4 font-bold text-lg space-y-2">
          <div>Total General (solo Total por Producto): ${totalGeneral.toFixed(2)}</div>
          <div>IVA Total de los Productos: ${ivaTotal.toFixed(2)}</div>
        </div>
      )}

      {showGraph && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-2">Gráfica de Ingresos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={generarDatosGrafica()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#4CAF50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
