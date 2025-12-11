import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config/api";
import logo from "../assets/astrodishlogo1.png";

// SVG Icons - AstroDish Design System
const Icons = {
  check: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>,
  circle: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth={2} />
  </svg>,
  sparkles: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Obtener plan del query parameter (default: launch)
  const selectedPlan = searchParams.get('plan') || 'launch';

  // Estado del formulario multi-step
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estado del formulario - Paso 1: Datos del Negocio
  const [businessData, setBusinessData] = useState({
    companyName: '',
    subdomain: ''
  });

  // Estado del formulario - Paso 2: Datos del Admin
  const [adminData, setAdminData] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: ''
  });

  // Validación de contraseña en tiempo real
  const getPasswordValidation = (password) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
  };

  const passwordValidation = getPasswordValidation(adminData.ownerPassword);

  // Estado de validación del subdomain
  const [subdomainStatus, setSubdomainStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });

  // Validar subdomain en tiempo real (debounced)
  useEffect(() => {
    if (businessData.subdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: null, message: '' });
      return;
    }

    const timer = setTimeout(async () => {
      await checkSubdomainAvailability(businessData.subdomain);
    }, 500);

    return () => clearTimeout(timer);
  }, [businessData.subdomain]);

  // Función para verificar disponibilidad del subdomain
  const checkSubdomainAvailability = async (subdomain) => {
    try {
      setSubdomainStatus({ checking: true, available: null, message: 'Verificando...' });

      const response = await axios.get(
        `${apiBaseUrl}/api/tenants/check-subdomain/${subdomain}`
      );

      if (response.data.success && response.data.data.available) {
        setSubdomainStatus({
          checking: false,
          available: true,
          message: 'Subdomain disponible'
        });
      } else {
        setSubdomainStatus({
          checking: false,
          available: false,
          message: response.data.data.reason || 'Subdomain no disponible'
        });
      }
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainStatus({
        checking: false,
        available: false,
        message: 'Error al verificar subdomain'
      });
    }
  };

  // Manejar cambios en datos del negocio
  const handleBusinessDataChange = (field, value) => {
    if (field === 'subdomain') {
      // Limpiar y convertir a minúsculas
      value = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    }
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  // Manejar cambios en datos del admin
  const handleAdminDataChange = (field, value) => {
    setAdminData(prev => ({ ...prev, [field]: value }));
  };

  // Validar paso 1
  const validateStep1 = () => {
    if (!businessData.companyName.trim()) {
      setMessage({ type: 'error', text: 'El nombre del negocio es requerido' });
      return false;
    }
    if (!businessData.subdomain.trim()) {
      setMessage({ type: 'error', text: 'El subdomain es requerido' });
      return false;
    }
    if (subdomainStatus.available !== true) {
      setMessage({ type: 'error', text: 'Elige un subdomain válido y disponible' });
      return false;
    }
    return true;
  };

  // Validar paso 2
  const validateStep2 = () => {
    if (!adminData.ownerName.trim()) {
      setMessage({ type: 'error', text: 'El nombre del administrador es requerido' });
      return false;
    }
    if (!adminData.ownerEmail.trim()) {
      setMessage({ type: 'error', text: 'El email es requerido' });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.ownerEmail)) {
      setMessage({ type: 'error', text: 'El email no es válido' });
      return false;
    }
    if (!adminData.ownerPassword) {
      setMessage({ type: 'error', text: 'La contraseña es requerida' });
      return false;
    }
    if (adminData.ownerPassword.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres' });
      return false;
    }
    if (adminData.ownerPassword !== adminData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return false;
    }
    return true;
  };

  // Avanzar al siguiente paso
  const handleNextStep = () => {
    setMessage({ type: '', text: '' });

    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  // Volver al paso anterior
  const handlePrevStep = () => {
    setMessage({ type: '', text: '' });
    setCurrentStep(1);
  };

  // Enviar registro
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!validateStep2()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiBaseUrl}/api/tenants/register`, {
        // Datos del negocio
        companyName: businessData.companyName.trim(),
        subdomain: businessData.subdomain.trim(),
        // Datos del admin
        ownerName: adminData.ownerName.trim(),
        ownerEmail: adminData.ownerEmail.trim(),
        ownerPassword: adminData.ownerPassword,
        // Plan seleccionado
        plan: selectedPlan
      });

      console.log('Registro exitoso:', response.data);

      if (response.data.success && response.data.data) {
        // Guardar token y datos del usuario
        localStorage.setItem("token", response.data.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
        localStorage.setItem("userRole", response.data.data.user.role);
        localStorage.setItem("tenant", JSON.stringify(response.data.data.tenant));

        // Mostrar mensaje de éxito
        setMessage({
          type: 'success',
          text: '¡Registro exitoso! Redirigiendo...'
        });

        // Redirigir después de 1.5 segundos
        setTimeout(() => {
          navigate('/onboarding');
        }, 1500);
      }
    } catch (error) {
      console.error('Error en registro:', error);

      let errorMessage = 'Error al completar el registro';

      if (error.response) {
        const { data } = error.response;
        errorMessage = data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar al servidor';
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Panel izquierdo - Información */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 50%, #7a9de8 100%)' }}>
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#2b354f' }}></div>
          <div className="absolute top-0 -right-4 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#5e85e0', animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ backgroundColor: '#7a9de8', animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <div className="mb-8">
              <img src={logo} alt="AstroDish POS" className="h-24 mb-6 shadow-2xl" style={{ maxWidth: '100%', objectFit: 'contain' }} />
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                {selectedPlan === 'pro' ? 'Plan Pro Anual' :
                 selectedPlan === 'basic' ? 'Plan Basic Anual' :
                 'Comienza con el Plan Lanzamiento'}
                <span className="block text-2xl font-normal mt-2" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  {selectedPlan === 'pro' ? '$8,499/año' :
                   selectedPlan === 'basic' ? '$5,999/año' :
                   '$1,249 por 3 meses'}
                </span>
              </h1>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Configuración instantánea</h3>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Empieza a vender en menos de 5 minutos</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Datos seguros</h3>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Tu información protegida con encriptación</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Multi-usuario</h3>
                  <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Agrega empleados y gestiona permisos</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-4 backdrop-blur-sm rounded-lg border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <p className="text-sm flex items-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {Icons.sparkles()} <strong>
                  {selectedPlan === 'pro' ? 'Plan Pro incluye:' :
                   selectedPlan === 'basic' ? 'Plan Basic incluye:' :
                   'Plan Lanzamiento incluye:'}
                </strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm">
                {selectedPlan === 'pro' ? (
                  <>
                    <li>• 20 usuarios simultáneos</li>
                    <li>• 3 tiendas</li>
                    <li>• Hasta 2,000 productos</li>
                    <li>• Multi-tienda habilitado</li>
                  </>
                ) : selectedPlan === 'basic' ? (
                  <>
                    <li>• 5 usuarios simultáneos</li>
                    <li>• 1 tienda</li>
                    <li>• Hasta 500 productos</li>
                    <li>• Delivery y reportes</li>
                  </>
                ) : (
                  <>
                    <li>• 5 usuarios simultáneos</li>
                    <li>• 1 tienda</li>
                    <li>• Hasta 500 productos</li>
                    <li>• 3 meses de acceso</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="lg:hidden mb-6">
              <img src={logo} alt="AstroDish POS" className="h-20 mx-auto shadow-lg" style={{ maxWidth: '100%', objectFit: 'contain' }} />
            </div>
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#2b354f' }}>
              Crear cuenta
            </h2>
            <p style={{ color: '#2b354f' }}>
              Paso {currentStep} de 2: {currentStep === 1 ? 'Datos del negocio' : 'Datos del administrador'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(currentStep / 2) * 100}%`,
                background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)'
              }}
            ></div>
          </div>

          {/* Formulario */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <form className="space-y-6" onSubmit={currentStep === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>

              {/* PASO 1: Datos del Negocio */}
              {currentStep === 1 && (
                <>
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                      Nombre del Negocio *
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      required
                      value={businessData.companyName}
                      onChange={(e) => handleBusinessDataChange('companyName', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#2b354f', color: '#2b354f' }}
                      placeholder="Mi Tienda S.A."
                    />
                  </div>

                  <div>
                    <label htmlFor="subdomain" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                      Subdomain * <span className="text-xs" style={{ color: '#7a9de8' }}>(solo letras, números y guiones)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="subdomain"
                        type="text"
                        required
                        value={businessData.subdomain}
                        onChange={(e) => handleBusinessDataChange('subdomain', e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                        style={{ '--tw-ring-color': '#2b354f', color: '#2b354f' }}
                        placeholder="mi-tienda"
                        minLength={3}
                        maxLength={30}
                      />
                      {subdomainStatus.checking && (
                        <div className="flex-shrink-0">
                          <svg className="animate-spin h-5 w-5" style={{ color: '#2b354f' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {!subdomainStatus.checking && subdomainStatus.available === true && (
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {!subdomainStatus.checking && subdomainStatus.available === false && (
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {subdomainStatus.message && (
                      <p className={`mt-1 text-sm ${subdomainStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                        {subdomainStatus.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* PASO 2: Datos del Admin */}
              {currentStep === 2 && (
                <>
                  <div>
                    <label htmlFor="ownerName" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                      Nombre del Administrador *
                    </label>
                    <input
                      id="ownerName"
                      type="text"
                      required
                      value={adminData.ownerName}
                      onChange={(e) => handleAdminDataChange('ownerName', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#2b354f', color: '#2b354f' }}
                      placeholder="Juan Pérez"
                    />
                  </div>

                  <div>
                    <label htmlFor="ownerEmail" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                      Email *
                    </label>
                    <input
                      id="ownerEmail"
                      type="email"
                      required
                      value={adminData.ownerEmail}
                      onChange={(e) => handleAdminDataChange('ownerEmail', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#2b354f', color: '#2b354f' }}
                      placeholder="admin@mi-tienda.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="ownerPassword" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                      Contraseña *
                    </label>
                    <input
                      id="ownerPassword"
                      type="password"
                      required
                      value={adminData.ownerPassword}
                      onChange={(e) => handleAdminDataChange('ownerPassword', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#2b354f', color: '#2b354f' }}
                      placeholder="••••••••"
                      minLength={8}
                    />
                    <div className="mt-2 text-xs">
                      <p className="font-medium mb-1" style={{ color: '#7a9de8' }}>La contraseña debe tener:</p>
                      <ul className="space-y-0.5">
                        <li className="flex items-center gap-1" style={{ color: passwordValidation.minLength ? '#22c55e' : '#7a9de8' }}>
                          {passwordValidation.minLength ? Icons.check() : Icons.circle()} Mínimo 8 caracteres
                        </li>
                        <li className="flex items-center gap-1" style={{ color: passwordValidation.hasUppercase ? '#22c55e' : '#7a9de8' }}>
                          {passwordValidation.hasUppercase ? Icons.check() : Icons.circle()} Una letra mayúscula (A-Z)
                        </li>
                        <li className="flex items-center gap-1" style={{ color: passwordValidation.hasLowercase ? '#22c55e' : '#7a9de8' }}>
                          {passwordValidation.hasLowercase ? Icons.check() : Icons.circle()} Una letra minúscula (a-z)
                        </li>
                        <li className="flex items-center gap-1" style={{ color: passwordValidation.hasNumber ? '#22c55e' : '#7a9de8' }}>
                          {passwordValidation.hasNumber ? Icons.check() : Icons.circle()} Un número (0-9)
                        </li>
                        <li className="flex items-center gap-1" style={{ color: passwordValidation.hasSpecial ? '#22c55e' : '#7a9de8' }}>
                          {passwordValidation.hasSpecial ? Icons.check() : Icons.circle()} Un carácter especial (!@#$%^&*)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: '#2b354f' }}>
                      Confirmar Contraseña *
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={adminData.confirmPassword}
                      onChange={(e) => handleAdminDataChange('confirmPassword', e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': '#2b354f', color: '#2b354f' }}
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </>
              )}

              {/* Mensaje de error/éxito */}
              {message.text && (
                <div
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: message.type === 'error' ? '#fecaca' : '#bbf7d0'
                  }}
                >
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5"
                        style={{ color: message.type === 'error' ? '#ef4444' : '#22c55e' }}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        {message.type === 'error' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p
                        className="text-sm font-medium"
                        style={{ color: message.type === 'error' ? '#dc2626' : '#16a34a' }}
                      >
                        {message.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex space-x-4">
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 disabled:opacity-50 transition-all duration-200"
                    style={{ color: '#2b354f', borderColor: '#d1d5db' }}
                  >
                    ← Atrás
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading || (currentStep === 1 && subdomainStatus.available !== true)}
                  className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                  style={{
                    background: loading ? '#7a9de8' : 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)',
                    '--tw-ring-color': '#2b354f'
                  }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin inline-block -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creando cuenta...
                    </>
                  ) : currentStep === 1 ? (
                    'Continuar →'
                  ) : (
                    'Crear Cuenta'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm" style={{ color: '#2b354f' }}>
              ¿Ya tienes una cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-medium transition-colors duration-200"
                style={{ color: '#2b354f' }}
                onMouseEnter={(e) => e.target.style.color = '#5e85e0'}
                onMouseLeave={(e) => e.target.style.color = '#2b354f'}
              >
                Inicia sesión aquí
              </button>
            </p>
            <p className="text-xs mt-4" style={{ color: '#5e85e0' }}>
              Al crear una cuenta, aceptas nuestros Términos de Servicio y Política de Privacidad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
