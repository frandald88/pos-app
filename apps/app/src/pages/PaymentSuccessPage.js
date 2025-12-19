import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiBaseUrl from '../config/api';

const LANDING_URL = process.env.REACT_APP_LANDING_URL || 'http://localhost:3001';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(10);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar la sesión de pago
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No se encontró información de la sesión de pago');
        setVerifying(false);
        return;
      }

      try {
        // Opcional: Verificar el estado del pago con el backend
        const response = await axios.get(
          `${apiBaseUrl}/api/payments/verify-session/${sessionId}`
        );

        if (response.data.success) {
          setVerifying(false);
        } else {
          setError('No se pudo verificar el pago');
          setVerifying(false);
        }
      } catch (err) {
        // Si falla la verificación, asumimos que está bien
        // porque el webhook ya procesó el pago
        console.log('Verificación opcional falló, continuando...');
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  // No auto-redirigir - el usuario debe revisar su email
  // useEffect(() => {
  //   if (!verifying && !error && countdown > 0) {
  //     const timer = setTimeout(() => {
  //       setCountdown(countdown - 1);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   } else if (countdown === 0) {
  //     navigate('/');
  //   }
  // }, [countdown, verifying, error, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: '#46546b' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg" style={{ color: '#697487' }}>Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
              Error al procesar el pago
            </h2>
            <p className="mb-6" style={{ color: '#697487' }}>
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
              >
                Volver al inicio
              </button>
              <button
                onClick={() => window.location.href = `${LANDING_URL}/#/contact`}
                className="w-full py-3 px-6 rounded-lg font-semibold border-2 transition-all duration-200"
                style={{ borderColor: '#46546b', color: '#46546b' }}
              >
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
            ¡Pago Exitoso!
          </h1>
          <p className="text-lg" style={{ color: '#697487' }}>
            Gracias por confiar en AstroDish
          </p>
        </div>

        {/* Process Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-bold mb-3 flex items-center" style={{ color: '#1e40af' }}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ¿Qué sigue ahora?
          </h3>
          <ol className="space-y-2 text-sm" style={{ color: '#1e40af' }}>
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Estamos creando tu cuenta automáticamente</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Recibirás un correo electrónico con un link para activar tu cuenta en los próximos minutos</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Haz clic en el link y crea tu contraseña personal</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Inicia sesión y comienza a usar AstroDish</span>
            </li>
          </ol>
        </div>

        {/* What You Get */}
        <div className="mb-6">
          <h3 className="font-bold mb-3" style={{ color: '#23334e' }}>
            Tu suscripción incluye:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm" style={{ color: '#697487' }}>Acceso completo al sistema</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm" style={{ color: '#697487' }}>Todos los módulos incluidos</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm" style={{ color: '#697487' }}>Soporte técnico</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm" style={{ color: '#697487' }}>Actualizaciones incluidas</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="border-t pt-6" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
            >
              Volver al Inicio
            </button>
            <p className="text-center text-sm" style={{ color: '#697487' }}>
              Revisa tu correo electrónico para activar tu cuenta
            </p>
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: '#e5e7eb' }}>
          <p className="text-sm mb-2" style={{ color: '#697487' }}>
            ¿No recibiste el correo o tienes problemas?
          </p>
          <button
            onClick={() => window.location.href = `${LANDING_URL}/#/contact`}
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: '#46546b' }}
            onMouseEnter={(e) => e.target.style.color = '#23334e'}
            onMouseLeave={(e) => e.target.style.color = '#46546b'}
          >
            Contactar Soporte →
          </button>
        </div>
      </div>
    </div>
  );
}
