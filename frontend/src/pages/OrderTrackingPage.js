import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function OrderTrackingPage() {
  const [sales, setSales] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("en_preparacion");
  const token = localStorage.getItem("token");

  const fetchSales = () => {
    axios
      .get(`${apiBaseUrl}/api/sales?status=${selectedStatus}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setSales(res.data))
      .catch((err) => console.error("Error cargando ventas", err));
  };

  useEffect(() => {
    fetchSales();
  }, [selectedStatus]);

  const updateStatus = (saleId, newStatus) => {
    axios
      .patch(
        `${apiBaseUrl}/api/sales/${saleId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => fetchSales())
      .catch((err) => console.error("Error actualizando estado", err));
  };

        const statusOptions = [
        { value: "en_preparacion", label: "En preparación" },
        { value: "listo_para_envio", label: "Listo para envío" },
        { value: "entregado_y_cobrado", label: "Entregado" },
        ];

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Seguimiento de Pedidos</h1>

      {/* Filtro por estado */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Filtrar por estado</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="p-2 border rounded w-full"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de ventas */}
      {sales.map((sale) => (
        <div key={sale._id} className="mb-4 p-3 bg-white rounded shadow">
          <h3 className="font-bold text-md">Venta #{sale._id}</h3>
          <p>
            Total: ${sale.total.toFixed(2)} | Estado actual:{" "}
            <strong>{statusOptions.find((s) => s.value === sale.status)?.label}</strong>
          </p>
          <p>
            Tipo de venta: {sale.type} | Método de pago: {sale.method}
          </p>
          <ul className="mt-2 text-sm">
            {sale.items.map((item, idx) => (
              <li key={idx}>
                {item.name} x{item.quantity} - ${item.price.toFixed(2)}
                {item.note && <em> (Nota: {item.note})</em>}
              </li>
            ))}
          </ul>

          {/* Acciones según estado actual */}
          <div className="mt-2 space-x-2">
            {sale.status === "en_preparacion" && (
              <button
                onClick={() => updateStatus(sale._id, "listo_para_envio")}
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Marcar como Listo para Envío
              </button>
            )}

            {(sale.status === "en_preparacion" || sale.status === "listo_para_envio") && (
                <button
                    onClick={() => updateStatus(sale._id, "cancelada")}
                    className="px-3 py-1 bg-red-500 text-white rounded"
                >
                    Cancelar Pedido
                </button>
                )}

            {sale.status === "listo_para_envio" && (
            <button
                onClick={() => updateStatus(sale._id, "entregado_y_cobrado")}
                className="px-3 py-1 bg-green-600 text-white rounded"
            >
                Marcar como Entregado
            </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
