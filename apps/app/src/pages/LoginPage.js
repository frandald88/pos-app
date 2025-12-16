import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config/api";
import logo from "../assets/Astrodish_logo_2.png"; // Logo de AstroDish

// SVG Icons - AstroDish Design System
const Icons = {
  calendar: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  clock: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  globe: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  // Estado para selección de tenant cuando hay múltiples
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);

  useEffect(() => {
  const token = localStorage.getItem("token");
  const tokenExpiration = localStorage.getItem("tokenExpiration");
  
  if (token) {
    // Si hay configuración de expiración, verificarla
    if (tokenExpiration) {
      const expirationDate = new Date(tokenExpiration);
      const now = new Date();
      
      if (now > expirationDate) {
        // Token expirado - limpiar localStorage
        localStorage.clear();
        console.log("Sesión expirada");
        return; // No redirigir, mantener en login
      }
    }
    
    // Token válido o sin expiración configurada - redirigir
    navigate("/admin/ventas");
  }
}, [navigate]);

  // Obtener fecha y hora actual
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('es-MX', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: now.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const { date, time } = getCurrentDateTime();

  const handleLogin = async (e, tenantIdOverride = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage("");

    const tenantToUse = tenantIdOverride || selectedTenantId;

    console.log("Intentando login con:", {
      email,
      tenantId: tenantToUse,
      endpoint: `${apiBaseUrl}/api/auth/login`
    });

    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/login`, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        tenantId: tenantToUse
      });

      console.log("Login response:", response.data);

      // Verificar si requiere selección de tenant
      if (response.data.success && response.data.data.requiresTenantSelection) {
        setAvailableTenants(response.data.data.tenants);
        setShowTenantSelector(true);
        setLoading(false);
        return;
      }

      // Login exitoso
      if (response.data.success && response.data.data) {
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        localStorage.setItem("userRole", response.data.data.user.role);

        // Guardar info del tenant
        if (response.data.data.tenant) {
          localStorage.setItem("tenantConfig", JSON.stringify(response.data.data.tenant));
        }

        if (rememberMe) {
          // Token persiste por 30 días
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30);
          localStorage.setItem("tokenExpiration", expirationDate.toISOString());
        } else {
          // Token expira al cerrar sesión/navegador
          sessionStorage.setItem("tempSession", "true");
        }

        console.log("Datos guardados en localStorage");

        // Verificar si debe cambiar contraseña
        if (response.data.data.user.mustChangePassword) {
          navigate("/change-password");
        } else {
          navigate("/admin/ventas");
        }
      } else {
        setMessage("Error: Respuesta inesperada del servidor");
      }

    } catch (err) {
      console.error("Error de login:", err);

      let errorMessage = "Error de autenticación";

      if (err.response) {
        const { status, data } = err.response;

        if (data && data.message) {
          errorMessage = data.message;
        } else {
          switch (status) {
            case 400:
              errorMessage = "Email o contraseña incorrectos";
              break;
            case 404:
              errorMessage = "Usuario no encontrado";
              break;
            case 500:
              errorMessage = "Error del servidor";
              break;
            default:
              errorMessage = `Error ${status}`;
          }
        }
      } else if (err.request) {
        errorMessage = "No se pudo conectar al servidor";
      }

      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de tenant
  const handleTenantSelect = (tenantId) => {
    setSelectedTenantId(tenantId);
    setShowTenantSelector(false);
    handleLogin(null, tenantId);
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información corporativa */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2b354f 0%, #2b354f 70%, #5e85e0 100%)' }}>
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#2b354f' }}></div>
          <div className="absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#5e85e0', animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#7a9de8', animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            {/* Logo y branding */}
            <div className="mb-8">
              <img src={logo} alt="AstroDish POS" className="h-24 mb-6 shadow-2xl" style={{ maxWidth: '100%', objectFit: 'contain' }} />
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                
                <span className="block text-2xl font-normal mt-2" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  Punto de Venta Profesional
                </span>
              </h1>
            </div>

            {/* Características */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Rápido y Eficiente</h3>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Procesamiento instantáneo de ventas</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Seguro y Confiable</h3>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Protección de datos empresariales</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Reportes Detallados</h3>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Análisis completo del negocio</p>
                </div>
              </div>
            </div>

            {/* Información del sistema */}
            <div className="mt-12 p-4 backdrop-blur-sm rounded-lg border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{Icons.calendar()} Fecha:</span>
                  <span className="font-medium text-white">{date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{Icons.clock()} Hora:</span>
                  <span className="font-medium text-white">{time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{Icons.globe()} Estado:</span>
                  <span className="flex items-center text-white">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    En línea
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario de login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="max-w-md w-full space-y-8">
          {/* Header del formulario */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <img src={logo} alt="Logo" className="w-16 h-16 mx-auto rounded-xl shadow-lg" />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#2b354f' }}>
              Iniciar Sesión
            </h2>
            <p style={{ color: '#697487' }}>
              Accede a tu panel de administración
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                  Email
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
                    disabled={loading || showTenantSelector}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200"
                    style={{
                      '--tw-ring-color': '#2b354f',
                      color: '#2b354f'
                    }}
                    onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#2b354f')}
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200"
                    style={{
                      '--tw-ring-color': '#2b354f',
                      color: '#2b354f'
                    }}
                    onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#2b354f')}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
                    style={{ color: '#8c95a4' }}
                    onMouseEnter={(e) => e.target.style.color = '#697487'}
                    onMouseLeave={(e) => e.target.style.color = '#8c95a4'}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Opciones adicionales */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                    style={{
                      '--tw-ring-color': '#2b354f',
                      accentColor: '#2b354f'
                    }}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm" style={{ color: '#2b354f' }}>
                    Recordarme
                  </label>
                </div>
                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="font-medium transition-colors duration-200"
                    style={{ color: '#2b354f' }}
                    onMouseEnter={(e) => e.target.style.color = '#5e85e0'}
                    onMouseLeave={(e) => e.target.style.color = '#2b354f'}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              {/* Botón de submit */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  style={{
                    background: loading ? '#8c95a4' : 'linear-gradient(135deg, #2b354f 0%, #2b354f 70%, #5e85e0 100%)',
                    '--tw-ring-color': '#2b354f'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = 'linear-gradient(135deg, #5e85e0 0%, #5e85e0 50%, #7a9de8 100%)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.background = 'linear-gradient(135deg, #2b354f 0%, #2b354f 70%, #5e85e0 100%)';
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </div>

              {/* Mensaje de error */}
              {message && (
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

              {/* Selector de Tenant (cuando hay múltiples workspaces) */}
              {showTenantSelector && (
                <div className="rounded-lg border p-4" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
                  <p className="text-sm font-medium mb-3" style={{ color: '#0369a1' }}>
                    Selecciona tu workspace:
                  </p>
                  <div className="space-y-2">
                    {availableTenants.map((tenant) => (
                      <button
                        key={tenant.tenantId}
                        type="button"
                        onClick={() => handleTenantSelect(tenant.tenantId)}
                        className="w-full text-left px-4 py-3 rounded-lg border-2 transition-all hover:shadow-md"
                        style={{
                          borderColor: '#e2e8f0',
                          backgroundColor: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#5e85e0';
                          e.target.style.backgroundColor = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.backgroundColor = 'white';
                        }}
                      >
                        <div className="font-semibold" style={{ color: '#2b354f' }}>
                          {tenant.companyName}
                        </div>
                        <div className="text-xs" style={{ color: '#697487' }}>
                          {tenant.subdomain}.tuapp.com
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTenantSelector(false);
                      setAvailableTenants([]);
                    }}
                    className="mt-3 text-sm font-medium"
                    style={{ color: '#697487' }}
                  >
                    ← Volver
                  </button>
                </div>
              )}
            </form>
          </div>



          {/* Footer */}
          <div className="text-center">
            <p className="text-sm mb-4" style={{ color: '#697487' }}>
              ¿No tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-medium transition-colors duration-200"
                style={{ color: '#5e85e0' }}
                onMouseEnter={(e) => e.target.style.color = '#2b354f'}
                onMouseLeave={(e) => e.target.style.color = '#5e85e0'}
              >
                Regístrate aquí
              </button>
            </p>
            <p className="text-xs" style={{ color: '#8c95a4' }}>
              © 2025 AstroDish POS. Todos los derechos reservados.
            </p>
            <p className="text-xs mt-1" style={{ color: '#8c95a4' }}>
              Versión 2.0.1 •
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}