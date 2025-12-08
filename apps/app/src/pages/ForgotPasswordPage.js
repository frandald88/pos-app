import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config/api";
import logo from "../assets/logo.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/forgot-password`, {
        email: email.trim().toLowerCase()
      });

      console.log("✅ Forgot password response:", response.data);

      if (response.data.success) {
        setMessageType("success");
        setMessage(response.data.message || "Si el email existe en nuestro sistema, recibirás un enlace de recuperación");
        setEmail(""); // Limpiar campo
      }

    } catch (err) {
      console.error("❌ Error en forgot-password:", err);

      setMessageType("error");

      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else if (err.request) {
        setMessage("No se pudo conectar al servidor");
      } else {
        setMessage("Error al procesar la solicitud");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #23334e 0%, #46546b 50%, #697487 100%)' }}>
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#46546b' }}></div>
          <div className="absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#697487', animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#8c95a4', animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            {/* Logo y branding */}
            <div className="mb-8">
              <img src={logo} alt="Logo" className="w-20 h-20 mb-6 rounded-xl shadow-2xl bg-white/10 p-3" />
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                Recuperación de Contraseña
                <span className="block text-2xl font-normal mt-2" style={{ color: '#8c95a4' }}>
                  Recupera el acceso a tu cuenta
                </span>
              </h1>
            </div>

            {/* Información */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0" style={{ backgroundColor: 'rgba(140, 149, 164, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Recuperación por Email</h3>
                  <p className="text-sm" style={{ color: '#8c95a4' }}>Recibirás un enlace seguro en tu correo electrónico</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0" style={{ backgroundColor: 'rgba(140, 149, 164, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-4a1 1 0 00-1-1H7a1 1 0 00-1 1v4a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Proceso Seguro</h3>
                  <p className="text-sm" style={{ color: '#8c95a4' }}>Token cifrado con expiración de 1 hora</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0" style={{ backgroundColor: 'rgba(140, 149, 164, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Rápido y Sencillo</h3>
                  <p className="text-sm" style={{ color: '#8c95a4' }}>Recupera tu cuenta en minutos</p>
                </div>
              </div>
            </div>

            {/* Información de seguridad */}
            <div className="mt-12 p-4 backdrop-blur-sm rounded-lg border" style={{ backgroundColor: 'rgba(140, 149, 164, 0.1)', borderColor: 'rgba(140, 149, 164, 0.2)' }}>
              <div className="text-sm space-y-2">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: '#8c95a4' }}>Enlace de un solo uso</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: '#8c95a4' }}>Token cifrado con bcrypt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: '#8c95a4' }}>Expiración automática</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="max-w-md w-full space-y-8">
          {/* Header del formulario */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <img src={logo} alt="Logo" className="w-16 h-16 mx-auto rounded-xl shadow-lg" />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
              ¿Olvidaste tu contraseña?
            </h2>
            <p style={{ color: '#697487' }}>
              Ingresa tu email y te enviaremos un enlace para recuperarla
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={loading}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200"
                    style={{
                      '--tw-ring-color': '#46546b',
                      color: '#23334e'
                    }}
                    onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#46546b')}
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Botón de submit */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  style={{
                    background: loading ? '#8c95a4' : 'linear-gradient(135deg, #46546b 0%, #23334e 100%)',
                    '--tw-ring-color': '#46546b'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = 'linear-gradient(135deg, #23334e 0%, #46546b 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.background = 'linear-gradient(135deg, #46546b 0%, #23334e 100%)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Enviar Enlace de Recuperación
                    </>
                  )}
                </button>
              </div>

              {/* Mensaje de éxito */}
              {message && messageType === "success" && (
                <div className="rounded-lg border p-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#86efac' }}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5" style={{ color: '#22c55e' }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium" style={{ color: '#16a34a' }}>{message}</p>
                      <p className="text-xs mt-1" style={{ color: '#15803d' }}>
                        Revisa tu bandeja de entrada y tu carpeta de spam
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de error */}
              {message && messageType === "error" && (
                <div className="rounded-lg border p-4" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5" style={{ color: '#ef4444' }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium" style={{ color: '#dc2626' }}>{message}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center mx-auto font-medium transition-colors duration-200"
              style={{ color: '#46546b' }}
              onMouseEnter={(e) => e.target.style.color = '#23334e'}
              onMouseLeave={(e) => e.target.style.color = '#46546b'}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al inicio de sesión
            </button>

            <p className="text-xs" style={{ color: '#8c95a4' }}>
              © 2025 Sistema POS. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
