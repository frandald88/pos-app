import { useState } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo5.png'; // ajusta el path si está en otra carpeta
import apiBaseUrl from "../apiConfig";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/login`, {
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
    <div className="h-screen flex items-center justify-center" style={{ backgroundColor: '#23334e' }}>
      <div className="p-8 rounded-xl shadow-md w-80" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" style={{ width: '180px', height: 'auto' }} />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Login</h1>
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
          className="w-full text-white py-2 rounded transition"
          style={{ backgroundColor: '#46546b' }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#3a4456'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#46546b'}
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
