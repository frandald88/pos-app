import { useEffect, useState } from "react";
import axios from "axios";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ username: "", password: "", role: "vendedor" });
  const [editingId, setEditingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchUsers = () => {
    axios
      .get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch(() => setMsg("Error al cargar usuarios ❌"));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editingId
      ? `http://localhost:5000/api/users/${editingId}`
      : "http://localhost:5000/api/users";

    const method = editingId ? "put" : "post";
    const payload = editingId
      ? { username: form.username, role: form.role }
      : form;

    axios[method](url, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(() => {
        setMsg(editingId ? "Usuario actualizado ✅" : "Usuario creado ✅");
        setForm({ username: "", password: "", role: "vendedor" });
        setEditingId(null);
        fetchUsers();
      })
      .catch(() => setMsg(`Error al ${editingId ? "actualizar" : "crear"} usuario ❌`));
  };

  const handleEdit = (user) => {
    setForm({ username: user.username, password: "", role: user.role });
    setEditingId(user._id);
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    axios
      .delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Usuario eliminado ✅");
        fetchUsers();
      })
      .catch(() => setMsg("Error al eliminar usuario ❌"));
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Administración de usuarios</h1>

      {msg && <p className="mb-4 text-sm text-blue-600">{msg}</p>}

      <form onSubmit={handleSubmit} className="mb-6 grid gap-2 max-w-sm">
        <input
          placeholder="Username"
          className="p-2 border rounded"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        {!editingId && (
          <input
            placeholder="Password"
            type="password"
            className="p-2 border rounded"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        )}
        <select
          className="p-2 border rounded"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
            <option value="repartidor">Repartidor</option>
        </select>
        <button className="text-white p-2 rounded" style={{ backgroundColor: "#46546b" }}>
          {editingId ? "Actualizar Usuario" : "Crear Usuario"}
        </button>
      </form>

      <table className="table-auto w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Rol</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td className="p-2 border">{u.username}</td>
              <td className="p-2 border">{u.role}</td>
              <td className="p-2 border">
                <button
                  className="mr-2 text-blue-600 hover:underline"
                  onClick={() => handleEdit(u)}
                >
                  Editar
                </button>
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => handleDelete(u._id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
