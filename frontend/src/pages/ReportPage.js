import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { saveAs } from "file-saver";
import Papa from "papaparse";
import apiBaseUrl from "../apiConfig";

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
  const [tiendas, setTiendas] = useState([]);
  const [tiendaFiltro, setTiendaFiltro] = useState("");
  const [tipoReporte, setTipoReporte] = useState("ventas");
  const [selectedSales, setSelectedSales] = useState([]);

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
      return;
    }

    setFechaInicio(inicio.toISOString().slice(0, 16));
    setFechaFin(fin.toISOString().slice(0, 16));
  };

  useEffect(() => {
    generarRangoFechas();
  }, [periodo]);

  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/api/tiendas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTiendas(res.data))
      .catch(() => console.error("Error al cargar tiendas"));
  }, [token]);

  // 💡 Nueva limpieza al cambiar tipo de reporte
    useEffect(() => {
      setVentas([]);
      setMsg("");
    }, [tipoReporte]);

  const handleGenerar = () => {
    setVisibleRows(10);
    setShowGraph(false);

    const endpoint =
      tipoReporte === "ventas" ? "/api/report/ventas" : "/api/returns";

    axios
      .get(`${apiBaseUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params:
          tipoReporte === "ventas"
            ? { tipoVenta, tipo, inicio: fechaInicio, fin: fechaFin, tiendaId: tiendaFiltro }
            : {},
      })
      .then((res) => {
        setVentas(res.data);
        setMsg("Reporte generado ✅");
      })
      .catch(() => setMsg("Error al generar reporte ❌"));
  };

    const ventasFiltradas = tipoReporte === "ventas"
      ? ventas.filter((v) => {
          const nombre = v.producto?.toLowerCase() || "";
          const sku = v.sku?.toString() || "";
          const filtro = productoFiltro.toLowerCase();
          return nombre.includes(filtro) || sku.includes(filtro);
        })
      : [];

    const devolucionesFiltradas = tipoReporte === "devoluciones" ? ventas : [];

      const totalGeneral = tipoReporte === "ventas"
      ? ventasFiltradas.reduce((sum, v) => sum + (v.totalProducto || 0), 0)
      : devolucionesFiltradas.reduce((sum, v) => sum + (v.refundAmount || 0), 0);

      const ivaTotal = tipoReporte === "ventas"
          ? ventasFiltradas.reduce((sum, v) => sum + (v.ivaProducto || 0), 0)
          : 0;


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
      agrupados[key] += tipoReporte === "ventas" ? venta.totalProducto : venta.refundAmount;
    });

    return Object.keys(agrupados).map((key) => ({
      label: key,
      total: agrupados[key],
    }));
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(ventasFiltradas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, tipoReporte === "ventas" ? "reporte_ventas.csv" : "reporte_devoluciones.csv");
  };

  const handleDeleteNoStoreSales = () => {
  if (!window.confirm("¿Estás seguro de eliminar TODAS las ventas sin tienda? Esta acción no se puede deshacer.")) return;

  axios.delete(`${apiBaseUrl}/api/sales/no-store`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(res => {
    alert(res.data.message);
  })
  .catch(err => {
    console.error(err);
    alert("Error al eliminar ventas sin tienda.");
  });
};

const handleCheckboxChange = (ventaId) => {
  setSelectedSales((prevSelected) =>
    prevSelected.includes(ventaId)
      ? prevSelected.filter((id) => id !== ventaId)
      : [...prevSelected, ventaId]
  );
};

const handleDeleteSelectedSales = () => {
  if (selectedSales.length === 0) {
    alert("Selecciona al menos una venta para eliminar.");
    return;
  }

  if (!window.confirm(`¿Eliminar ${selectedSales.length} ventas seleccionadas? Esta acción es irreversible.`)) return;

  axios
    .post(`${apiBaseUrl}/api/sales/delete-multiple`, { ids: selectedSales }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      alert(res.data.message);
      setSelectedSales([]);
      handleGenerar();  // Recarga el reporte
    })
    .catch((err) => {
      console.error(err);
      alert("Error al eliminar ventas seleccionadas.");
    });
};

return (
  <div>
    <h1 className="text-xl font-bold mb-4">Reportes</h1>
    {msg && <p className="mb-4 text-sm text-blue-600">{msg}</p>}

    {/* Filtros */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Tipo de Reporte */}
      <div className="flex flex-col mb-4">
        <label className="text-sm font-semibold mb-1">Tipo de Reporte</label>
        <select
          value={tipoReporte}
          onChange={(e) => setTipoReporte(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="ventas">Ventas</option>
          <option value="devoluciones">Devoluciones</option>
        </select>
      </div>

      {tipoReporte === "ventas" && (
        <>
          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Tipo de Venta</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="p-2 border rounded">
              <option value="">Todos</option>
              <option value="mostrador">Mostrador</option>
              <option value="recoger">A Recoger</option>
              <option value="domicilio">A Domicilio</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold mb-1">Método de Pago</label>
            <select value={tipoVenta} onChange={(e) => setTipoVenta(e.target.value)} className="p-2 border rounded">
              <option value="">Todos</option>
              <option value="efectivo">Solo efectivo</option>
              <option value="transferencia">Solo transferencia</option>
              <option value="tarjeta">Solo tarjeta</option>
            </select>
          </div>
        </>
      )}

      <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Periodo</label>
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="p-2 border rounded">
          <option value="dia">Hoy</option>
          <option value="mes">Este mes</option>
          <option value="año">Este año</option>
          <option value="rango">Rango personalizado</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold mb-1">Tienda</label>
        <select value={tiendaFiltro} onChange={(e) => setTiendaFiltro(e.target.value)} className="p-2 border rounded">
          <option value="">Todas</option>
          {tiendas.map((t) => (
            <option key={t._id} value={t._id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      {tipoReporte === "ventas" && (
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
      )}
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

    <div className="flex space-x-2 mb-4">
      <button onClick={handleGenerar} className="bg-green-600 text-white p-2 rounded">
        Generar Reporte
      </button>
      {ventasFiltradas.length > 0 && tipoReporte === "ventas" && (
        <>
          <button onClick={() => setShowGraph(true)} className="bg-purple-600 text-white p-2 rounded">
            Generar Gráfico
          </button>
          <button onClick={handleExportCSV} className="bg-yellow-500 text-white p-2 rounded">
            Descargar CSV
          </button>
          {false && (
          <button
            onClick={handleDeleteNoStoreSales}
            className="bg-red-600 text-white p-2 rounded"
          >
            Eliminar ventas sin tienda
          </button>
          )}
          </>
      )}
    </div>

    {/* Tabla Ventas */}
    {tipoReporte === "ventas" && ventasFiltradas.length > 0 && ventasFiltradas.every(v => v.totalProducto !== undefined) && (
      <>
        <table className="table-auto w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Seleccionar</th>
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
              <th className="p-2 border">Tienda</th>
              <th className="p-2 border">Cliente</th>
            </tr>
          </thead>
          <tbody>
              {ventasFiltradas
                .slice(0, visibleRows)
                .map((venta, index) => (
                  <tr key={index}>
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedSales.includes(venta._id)}
                        onChange={() => handleCheckboxChange(venta._id)}
                      />
                    </td>
                    <td className="p-2 border">{venta.ventaId}</td>
                    <td className="p-2 border">{new Date(venta.date).toLocaleString()}</td>
                    <td className="p-2 border">{venta.user}</td>
                    <td className="p-2 border">{venta.type}</td>
                    <td className="p-2 border">{venta.method}</td>
                    <td className="p-2 border">{venta.producto}</td>
                    <td className="p-2 border">{venta.sku}</td>
                    <td className="p-2 border">{venta.cantidad}</td>
                    <td className="p-2 border">${(venta.precioUnitario ?? 0).toFixed(2)}</td>
                    <td className="p-2 border">${(venta.subtotal ?? 0).toFixed(2)}</td>
                    <td className="p-2 border">${(venta.ivaProducto ?? 0).toFixed(2)}</td>
                    <td className="p-2 border">${(venta.totalProducto ?? 0).toFixed(2)}</td>
                    <td className="p-2 border">${Number(venta.totalVenta ?? 0).toFixed(2)}</td>
                    <td className="p-2 border">
                      {Number(venta.descuento ?? 0).toFixed(2) !== "0.00" ? `$${Number(venta.descuento ?? 0).toFixed(2)}` : "-"}
                    </td>
                    <td className="p-2 border">
                      {Number(venta.porcentajeDescuento ?? 0).toFixed(2) !== "0.00"
                        ? `${Number(venta.porcentajeDescuento ?? 0).toFixed(2)}%`
                        : "-"}
                    </td>
                    <td className="p-2 border">{venta.repartidor}</td>
                    <td className="p-2 border">{venta.tienda}</td>
                    <td className="p-2 border">{venta.cliente}</td>
                  </tr>
                ))}
            </tbody>
        </table>

        {selectedSales.length > 0 && (
            <button
              onClick={handleDeleteSelectedSales}
              className="mt-2 p-2 bg-red-600 text-white rounded"
            >
              Eliminar ventas seleccionadas ({selectedSales.length})
            </button>
          )}

        {ventasFiltradas.length > visibleRows && (
          <button
            onClick={() => setVisibleRows(visibleRows + 10)}
            className="mt-2 p-2 bg-blue-500 text-white rounded"
          >
            Cargar más
          </button>
        )}
      </>
    )}

    {/* Tabla Devoluciones */}
    {tipoReporte === "devoluciones" && devolucionesFiltradas.length > 0 && (
      <table className="table-auto w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Fecha</th>
            <th className="p-2 border">Venta Original</th>
            <th className="p-2 border">Productos Devueltos</th>
            <th className="p-2 border">Monto Reembolsado</th>
            <th className="p-2 border">Procesado por</th>
          </tr>
        </thead>
        <tbody>
          {devolucionesFiltradas.map((ret) => (
            <tr key={ret._id}>
              <td className="p-2 border">{new Date(ret.date).toLocaleString("es-MX")}</td>
              <td className="p-2 border">{ret.saleId?._id || "N/A"}</td>
              <td className="p-2 border">
                <ul className="text-xs">
                  {Array.isArray(ret.returnedItems) ? (
                  ret.returnedItems.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}x - {item.reason || "Sin motivo"}
                    </li>
                  ))
                ): (
                        <li>Sin productos devueltos</li>
                      )}
                </ul>
              </td>
              <td className="p-2 border">${ret.refundAmount?.toFixed(2)}</td>
              <td className="p-2 border">{ret.processedBy?.username || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    {/* Totales */}
    {(ventasFiltradas.length > 0 || devolucionesFiltradas.length > 0) && (
      <div className="mt-4 text-right pr-4 font-bold text-lg space-y-2">
        {tipoReporte === "ventas" && (
          <div>
            Total General: ${totalGeneral.toFixed(2)} | IVA Total: ${ivaTotal.toFixed(2)}
          </div>
        )}
        {tipoReporte === "devoluciones" && (
          <div>Total Reembolsado: ${totalGeneral.toFixed(2)}</div>
        )}
      </div>
    )}

    {/* Gráfica */}
    {showGraph && tipoReporte === "ventas" && (
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
