import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });
      setMsg('✅ Login exitoso');
      localStorage.setItem('token', response.data.token);
      navigate('/admin/usuarios');
    } catch (error) {
      setMsg('❌ Error: ' + (error.response?.data?.message || 'No se pudo conectar'));
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-xl shadow-md w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <input
          type="text"
          placeholder="Usuario"
          className="w-full mb-3 p-2 border border-gray-300 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-4 p-2 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          onClick={handleLogin}
        >
          Iniciar sesión
        </button>
        {msg && (
          <div className="mt-4 text-sm break-words text-center bg-green-100 text-green-800 p-2 rounded">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
