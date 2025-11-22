import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/admin/ventas');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #23334e 0%, #46546b 100%)' }}>
      <div className="text-center p-8 rounded-xl shadow-2xl max-w-md" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
          Acceso No Autorizado
        </h1>
        <p className="text-lg mb-4" style={{ color: '#697487' }}>
          No tienes permisos para acceder a esta página
        </p>
        <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }}>
          <p className="text-sm" style={{ color: '#991b1b' }}>
            Esta sección está restringida solo para administradores
          </p>
        </div>
        <p className="text-sm mb-6" style={{ color: '#8c95a4' }}>
          Serás redirigido automáticamente en <span className="font-bold text-lg" style={{ color: '#23334e' }}>{countdown}</span> segundos...
        </p>
        <button
          onClick={() => navigate('/admin/ventas')}
          className="px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md hover:shadow-lg active:scale-95"
          style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
        >
          Ir al Punto de Venta
        </button>
      </div>
    </div>
  );
}
