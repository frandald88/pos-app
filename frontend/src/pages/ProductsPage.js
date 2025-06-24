import { useEffect, useState } from "react";
import axios from "axios";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", sku: "", price: 0, stock: 0, category: "" });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");


  const token = localStorage.getItem("token");


  const filteredProducts = products.filter((p) =>
  p.name.toLowerCase().includes(search.toLowerCase()) ||
  p.sku.toLowerCase().includes(search.toLowerCase()) ||
  p.category.toLowerCase().includes(search.toLowerCase()) 
);

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
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:5000/api/products/${editingId}`
      : "http://localhost:5000/api/products";

    const method = editingId ? "put" : "post";

    axios[method](url, form, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setMsg(editingId ? "Producto actualizado ✅" : "Producto creado ✅");
        setForm({ name: "", sku: "", price: 0, stock: 0, category: "" });
        setEditingId(null);
        fetchProducts();
      })
      .catch(() => setMsg("Error al guardar producto ❌"));
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, sku: p.sku, price: p.price, stock: p.stock, category: p.category });
    setEditingId(p._id);
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Eliminar este producto?")) return;
    axios
      .delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Producto eliminado ✅");
        fetchProducts();
      })
      .catch(() => setMsg("Error al eliminar producto ❌"));
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Administración de productos</h1>

      {msg && <p className="mb-4 text-sm text-blue-600">{msg}</p>}

      <input
        type="text"
        placeholder="Buscar producto..."
        className="mb-4 w-full p-2 border rounded"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        />

      <form onSubmit={handleSubmit} className="mb-6 grid gap-2 max-w-md">
        <input
          placeholder="Nombre"
          className="p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="SKU"
          className="p-2 border rounded"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
        <input
          type="number"
          placeholder="Precio"
          className="p-2 border rounded"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
        />
        <input
          type="number"
          placeholder="Stock"
          className="p-2 border rounded"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
        />
        <input
          placeholder="Categoría"
          className="p-2 border rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <button className="text-white p-2 rounded" style={{ backgroundColor: "#46546b" }}>
          {editingId ? "Actualizar Producto" : "Crear Producto"}
        </button>
      </form>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Nombre</th>
            <th className="p-2 border">SKU</th>
            <th className="p-2 border">Precio</th>
            <th className="p-2 border">Stock</th>
            <th className="p-2 border">Categoría</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((p) => (
            <tr key={p._id}>
              <td className="p-2 border">{p.name}</td>
              <td className="p-2 border">{p.sku}</td>
              <td className="p-2 border">${p.price}</td>
              <td className="p-2 border">{p.stock}</td>
              <td className="p-2 border">{p.category}</td>
              <td className="p-2 border">
                <button
                  className="mr-2 text-blue-600 hover:underline"
                  onClick={() => handleEdit(p)}
                >Editar</button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(p._id)}
                >Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
