import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../apiConfig";

export default function ReturnsPage() {
  const [saleId, setSaleId] = useState("");
  const [sale, setSale] = useState(null);
  const [returnedItems, setReturnedItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  const fetchSale = () => {
    axios
      .get(`${apiBaseUrl}/api/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
                    setSale(res.data);
            setReturnedItems(
                res.data.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                quantity: 0,
                maxQuantity: item.quantity,
                unitPrice: item.price,  // ✅ Aquí agregas el precio unitario
                reason: "",
                }))
            );
            setMsg("");
            })
      .catch(() => setMsg("Venta no encontrada ❌"));
  };

  const handleSubmit = () => {
    const itemsToReturn = returnedItems
      .filter((item) => item.quantity > 0)
      .map(({ productId, quantity, reason }) => ({
        productId,
        quantity,
        reason,
      }));

    if (itemsToReturn.length === 0) {
      setMsg("Debes seleccionar al menos un producto y cantidad a devolver ❌");
      return;
    }

    axios
      .post(
        `${apiBaseUrl}/api/returns`,
        {
          saleId,
          returnedItems: itemsToReturn,
          refundAmount,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setMsg("Devolución registrada ✅");
        setSale(null);
        setSaleId("");
        setRefundAmount(0);
        setReturnedItems([]);
      })
      .catch((error) => {
      if (error.response && error.response.data.message.includes("no tiene tienda")) {
        alert(error.response.data.message);
      } else {
        alert("Error inesperado al crear devolución.");
      }
    });  
  };

  const updateItemQuantity = (index, field, value) => {
    setReturnedItems((prev) => {
      const updated = [...prev];
      updated[index][field] = field === "quantity" ? Number(value) : value;
      return updated;
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Registrar Devolución</h1>

      {/* Buscar venta */}
      <div className="mb-4">
        <label className="block text-sm mb-1">ID de la Venta</label>
        <input
          type="text"
          value={saleId}
          onChange={(e) => setSaleId(e.target.value)}
          placeholder="Ingresa el ID de la venta"
          className="p-2 border rounded w-full"
        />
        <button
          onClick={fetchSale}
          className="mt-2 px-4 py-1 bg-blue-600 text-white rounded"
        >
          Buscar Venta
        </button>
      </div>

      {/* Si hay venta cargada */}
      {sale && (
        <div className="border p-4 rounded bg-white shadow mb-4">
          <h2 className="font-semibold mb-2">Venta Total: ${sale.total.toFixed(2)}</h2>
          <ul>
            {returnedItems.map((item, index) => (
                <li key={index} className="mb-4 border-b pb-2">
                <strong>{item.name}</strong>

                {/* Mostrar info de precio y cantidad vendida */}
                <p className="text-xs text-gray-600">
                    Vendidos: {item.maxQuantity} | Precio unitario: ${item.unitPrice.toFixed(2)} | Total: ${(item.maxQuantity * item.unitPrice).toFixed(2)}
                </p>

                {/* Cantidad a devolver */}
                <div className="mt-1">
                    <label className="block text-xs font-semibold text-gray-600">
                    Cantidad a devolver:
                    </label>
                    <input
                    type="number"
                    min="0"
                    max={item.maxQuantity}
                    value={item.quantity}
                    onChange={(e) =>
                        updateItemQuantity(index, "quantity", e.target.value)
                    }
                    placeholder="Ej: 1, 2, etc."
                    className="p-1 border rounded w-24 text-sm"
                    />
                </div>

                {/* Motivo de la devolución */}
                <div className="mt-1">
                    <label className="block text-xs font-semibold text-gray-600">
                    Motivo de devolución (opcional):
                    </label>
                    <input
                    type="text"
                    value={item.reason}
                    onChange={(e) =>
                        updateItemQuantity(index, "reason", e.target.value)
                    }
                    placeholder="Ej: Producto defectuoso"
                    className="p-1 border rounded w-full text-sm"
                    />
                </div>
                </li>
            ))}
            </ul>

          {/* Monto de reembolso */}
          <div className="mt-4">
            <label className="block text-sm mb-1">Monto a reembolsar ($)</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              className="p-2 border rounded w-full"
              placeholder="Ej. 150.00"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Registrar Devolución
          </button>
        </div>
      )}

      {msg && (
        <p className="mt-2 text-sm font-semibold text-red-600">{msg}</p>
      )}
    </div>
  );
}
