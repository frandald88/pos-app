import { useEffect, useState } from "react";
import axios from "axios";

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("token");
  const [taxRate] = useState(0.10); // 10% IVA
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [amountPaid, setAmountPaid] = useState(""); // monto con el que paga el cliente
  const [discount, setDiscount] = useState(0);


  const fetchProducts = () => {
    axios
      .get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProducts(res.data))
      .catch(() => setMsg("Error al cargar productos ❌"));
  };

  useEffect(() => {
  fetchProducts();

  axios
    .get("http://localhost:5000/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const delivery = res.data.filter((u) => u.role === "repartidor");
      setDeliveryUsers(delivery);
    })
    .catch((err) => {
      console.error("Error al cargar repartidores", err);
    });
    }, [token]); // ← Agrega 'token' como dependencia

  const addToCart = (product) => {
    const found = selected.find((p) => p._id === product._id);
    if (found) {
      setSelected(
        selected.map((p) =>
          p._id === product._id ? { ...p, qty: p.qty + 1 } : p
        )
      );
    } else {
      setSelected([...selected, { ...product, qty: 1 }]);
    }
  };

  const removeFromCart = (id) => {
    setSelected(selected.filter((p) => p._id !== id));
  };

  const rawSubtotal = selected.reduce((sum, p) => sum + p.price * p.qty, 0);
  const discountAmount = rawSubtotal * (discount / 100);
  const subtotalWithDiscount = rawSubtotal - discountAmount;
  const baseSubtotal = subtotalWithDiscount / (1 + taxRate);
  const tax = subtotalWithDiscount - baseSubtotal;
  const totalWithTax = subtotalWithDiscount;
  const change = amountPaid ? parseFloat(amountPaid) - totalWithTax : 0;
  const [saleType, setSaleType] = useState("mostrador");
  const [deliveryPerson, setDeliveryPerson] = useState("");
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  

  const handleSale = () => {
    axios
      .post(
        "http://localhost:5000/api/sales",
        {
        products: selected,
        method: paymentMethod,
        saleType,
        deliveryPerson: saleType === "domicilio" ? deliveryPerson : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then(() => {
        setMsg("Venta registrada ✅");
        setSelected([]);
      })
      .catch(() => setMsg("Error al registrar venta ❌"));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())||
  p.category.toLowerCase().includes(search.toLowerCase()) 
  );

  const groupedByCategory = filteredProducts.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});

  return (
    <div className="flex">
      <div className="w-2/3 p-4">
        <h2 className="text-lg font-bold mb-2">Productos</h2>
        <input
          type="text"
          placeholder="Buscar producto..."
          className="mb-4 w-full p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {msg && <p className="mb-4 text-blue-600">{msg}</p>}

        <div className="space-y-6">
          {Object.keys(groupedByCategory).map((cat) => (
            <div key={cat}>
              <h3 className="text-md font-semibold text-gray-700 mb-2">{cat}</h3>
              <div className="grid grid-cols-3 gap-4">
                {groupedByCategory[cat].map((p) => (
                  <div
                    key={p._id}
                    className="border p-3 rounded shadow hover:bg-gray-50 cursor-pointer"
                    onClick={() => addToCart(p)}
                  >
                    <h3 className="font-bold">{p.name}</h3>
                    <p>${p.price}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-1/3 bg-gray-100 p-4">
        <h2 className="text-lg font-bold mb-4">Carrito</h2>

{selected.map((item) => (
  <div key={item._id} className="mb-2 flex justify-between">
    <span>{item.name} x{item.qty} (${item.qty * item.price})</span>
    <button onClick={() => removeFromCart(item._id)} className="text-red-500 text-sm">Quitar</button>
  </div>
))}

<div className="mt-4">
  <label className="block text-sm mb-1">Descuento (%)</label>
  <input
    type="number"
    value={discount}
    onChange={(e) => setDiscount(Number(e.target.value))}
    className="p-2 border rounded w-full"
    placeholder="Ej. 10 para 10%"
  />
</div>


<div className="mt-4 text-sm">
  <div>Subtotal sin descuento: ${rawSubtotal.toFixed(2)}</div>
  <div>Descuento: -${discountAmount.toFixed(2)} ({discount}%)</div>
  <div>Subtotal sin IVA: ${baseSubtotal.toFixed(2)}</div>
  <div>IVA incluido: ${tax.toFixed(2)}</div>
  <div className="font-bold">Total: ${totalWithTax.toFixed(2)}</div>
</div>



<div className="mt-4">
  <label className="block text-sm mb-1">Método de pago</label>
  <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    className="p-2 border rounded w-full"
  >
    <option value="efectivo">Efectivo</option>
    <option value="transferencia">Transferencia</option>
    <option value="tarjeta">Tarjeta crédito/débito</option>
  </select>
</div>

<div className="mt-4">
  <label className="block text-sm mb-1">Tipo de venta</label>
  <select
    value={saleType}
    onChange={(e) => setSaleType(e.target.value)}
    className="p-2 border rounded w-full"
  >
    <option value="mostrador">Mostrador</option>
    <option value="recoger">A recoger</option>
    <option value="domicilio">A domicilio</option>
  </select>
</div>

{saleType === "domicilio" && (
  <div className="mt-4">
    <label className="block text-sm mb-1">Asignar repartidor</label>
    <select
      value={deliveryPerson}
      onChange={(e) => setDeliveryPerson(e.target.value)}
      className="p-2 border rounded w-full"
    >
      <option value="">-- Selecciona un repartidor --</option>
      {deliveryUsers.map((user) => (
        <option key={user._id} value={user._id}>
          {user.username}
        </option>
      ))}
    </select>
  </div>
)}

{paymentMethod === "efectivo" && (
  <div className="mt-4">
    <label className="block text-sm mb-1">Monto con el que paga el cliente</label>
    <input
      type="number"
      value={amountPaid}
      onChange={(e) => setAmountPaid(e.target.value)}
      className="p-2 border rounded w-full"
    />
    <div className="mt-1 text-sm">Cambio: <strong>${change > 0 ? change.toFixed(2) : "0.00"}</strong></div>
  </div>
)}

<button
  className="mt-6 w-full bg-green-600 text-white p-2 rounded"
  onClick={handleSale}
  disabled={!selected.length}
>
  Registrar Venta
</button>
      </div>
    </div>
  );
}
