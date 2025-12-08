import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config/api";
import logo from "../assets/logo.png";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', 'warning'
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Verificar token al cargar la página
  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) {
        setMessageType("error");
        setMessage("Enlace inválido. Falta el token o el email.");
        setVerifying(false);
        return;
      }

      try {
        const response = await axios.post(`${apiBaseUrl}/api/auth/verify-reset-token`, {
          token,
          email
        });

        if (response.data.success && response.data.data.valid) {
          setTokenValid(true);
          console.log("✅ Token válido");
        } else {
          setMessageType("error");
          setMessage("El enlace es inválido o ha expirado");
        }
      } catch (err) {
        console.error("❌ Error verificando token:", err);
        setMessageType("error");
        setMessage(err.response?.data?.message || "El enlace es inválido o ha expirado");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, email]);

  // Validar fortaleza de la contraseña
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength(null);
      return;
    }

    const strength = calculatePasswordStrength(newPassword);
    setPasswordStrength(strength);
  }, [newPassword]);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    // Longitud
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length < 8) feedback.push("Al menos 8 caracteres");

    // Mayúsculas
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Una letra mayúscula");
    }

    // Minúsculas
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Una letra minúscula");
    }

    // Números
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Un número");
    }

    // Caracteres especiales
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Un carácter especial (!@#$%...)");
    }

    let level = "weak";
    let color = "#ef4444";
    let text = "Débil";

    if (score >= 5) {
      level = "strong";
      color = "#22c55e";
      text = "Fuerte";
    } else if (score >= 3) {
      level = "medium";
      color = "#f59e0b";
      text = "Media";
    }

    return { score, level, color, text, feedback };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Validaciones del frontend
    if (newPassword !== confirmPassword) {
      setMessageType("error");
      setMessage("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (passwordStrength && passwordStrength.level === "weak") {
      setMessageType("warning");
      setMessage("La contraseña es demasiado débil. " + passwordStrength.feedback.join(", "));
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/api/auth/reset-password`, {
        token,
        email,
        newPassword
      });

      console.log("✅ Reset password response:", response.data);

      if (response.data.success) {
        setMessageType("success");
        setMessage("Contraseña actualizada exitosamente. Redirigiendo al login...");

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }

    } catch (err) {
      console.error("❌ Error al restablecer contraseña:", err);

      setMessageType("error");

      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else if (err.request) {
        setMessage("No se pudo conectar al servidor");
      } else {
        setMessage("Error al restablecer contraseña");
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
                Nueva Contraseña
                <span className="block text-2xl font-normal mt-2" style={{ color: '#8c95a4' }}>
                  Crea una contraseña segura
                </span>
              </h1>
            </div>

            {/* Requisitos de contraseña */}
            <div className="space-y-6">
              <div className="p-4 backdrop-blur-sm rounded-lg border" style={{ backgroundColor: 'rgba(140, 149, 164, 0.1)', borderColor: 'rgba(140, 149, 164, 0.2)' }}>
                <h3 className="text-lg font-semibold mb-3">Requisitos de contraseña:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: '#8c95a4' }}>Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: '#8c95a4' }}>Al menos una letra mayúscula</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: '#8c95a4' }}>Al menos una letra minúscula</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: '#8c95a4' }}>Al menos un número</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ color: '#8c95a4' }}>Al menos un carácter especial</span>
                  </div>
                </div>
              </div>

              {/* Consejos de seguridad */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm flex-shrink-0" style={{ backgroundColor: 'rgba(140, 149, 164, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Consejo de Seguridad</h3>
                  <p className="text-sm" style={{ color: '#8c95a4' }}>
                    Usa una contraseña única que no hayas utilizado en otros sitios
                  </p>
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
              Restablecer Contraseña
            </h2>
            <p style={{ color: '#697487' }}>
              Ingresa tu nueva contraseña
            </p>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            {verifying ? (
              // Estado de verificación
              <div className="text-center py-8">
                <svg className="animate-spin h-10 w-10 mx-auto mb-4" style={{ color: '#46546b' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p style={{ color: '#697487' }}>Verificando enlace...</p>
              </div>
            ) : !tokenValid ? (
              // Token inválido
              <div className="text-center py-4">
                <svg className="h-16 w-16 mx-auto mb-4" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  Enlace Inválido o Expirado
                </h3>
                <p className="mb-6" style={{ color: '#697487' }}>
                  {message || "El enlace de recuperación no es válido o ha expirado"}
                </p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white shadow-sm transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                >
                  Solicitar nuevo enlace
                </button>
              </div>
            ) : (
              // Formulario de nueva contraseña
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Cuenta
                  </label>
                  <div className="flex items-center px-3 py-3 border border-gray-200 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                    <svg className="h-5 w-5 mr-2" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span style={{ color: '#697487' }}>{email}</span>
                  </div>
                </div>

                {/* Campo Nueva Contraseña */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-4a1 1 0 00-1-1H7a1 1 0 00-1 1v4a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200"
                      style={{
                        '--tw-ring-color': '#46546b',
                        color: '#23334e'
                      }}
                      onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#46546b')}
                      placeholder="Ingresa tu nueva contraseña"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                  {/* Indicador de fortaleza */}
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                          {passwordStrength.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campo Confirmar Contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      disabled={loading}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200"
                      style={{
                        '--tw-ring-color': '#46546b',
                        color: '#23334e'
                      }}
                      onFocus={(e) => e.target.style.setProperty('--tw-ring-color', '#46546b')}
                      placeholder="Confirma tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200"
                      style={{ color: '#8c95a4' }}
                      onMouseEnter={(e) => e.target.style.color = '#697487'}
                      onMouseLeave={(e) => e.target.style.color = '#8c95a4'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? (
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
                        Actualizando contraseña...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Restablecer Contraseña
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje de advertencia */}
                {message && messageType === "warning" && (
                  <div className="rounded-lg border p-4" style={{ backgroundColor: '#fff3cd', borderColor: '#ffc107' }}>
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5" style={{ color: '#f59e0b' }} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium" style={{ color: '#d97706' }}>{message}</p>
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
            )}
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
