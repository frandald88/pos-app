import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Confetti from "react-confetti";
import apiBaseUrl from "../config/api";

// SVG Icons
const Icons = {
  restaurant: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  darkKitchen: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  supermarket: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  flag: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  party: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  celebration: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  checkmark: () => (
    <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // ✨ Cambiado de 1 a 0
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [skippedSteps, setSkippedSteps] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

  // ✨ Step 0: Business Type (NUEVO)
  const [businessType, setBusinessType] = useState(''); // 'restaurant', 'dark_kitchen', 'supermarket', 'fruteria'

  // Step 1: Store Config
  const [storeData, setStoreData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    nombreNegocio: '',
    rfc: ''
  });
  const [countryCode, setCountryCode] = useState('+52'); // ✨ Código de país seleccionado (default México)
  const [phoneNumber, setPhoneNumber] = useState(''); // ✨ Número sin código de país
  const [countryCodes, setCountryCodes] = useState([]); // ✨ Lista de códigos de país
  const [showCountryDropdown, setShowCountryDropdown] = useState(false); // ✨ Estado del dropdown personalizado
  const dropdownRef = useRef(null); // ✨ Ref para detectar clicks fuera del dropdown

  // Step 2: Products
  const [productsOption, setProductsOption] = useState('sample'); // 'sample' or 'manual' or 'skip'
  const [sampleProducts, setSampleProducts] = useState([]);

  // Step 4: Team
  const [teamEmail, setTeamEmail] = useState('');
  const [createdTeamMember, setCreatedTeamMember] = useState(null); // { email, tempPassword }

  const totalSteps = 5; // ✨ Aumentado de 4 a 5

  useEffect(() => {
    checkOnboardingStatus();
    fetchSampleProducts();
    fetchCountryCodes(); // ✨ Cargar códigos de país
  }, []);

  // Recargar productos de ejemplo cuando se selecciona el businessType
  useEffect(() => {
    if (completedSteps.includes(1)) {
      fetchSampleProducts();
    }
  }, [completedSteps]);

  // ✨ Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Verificar si onboarding ya completado
  const checkOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiBaseUrl}/api/onboarding/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data.completed) {
        // Ya completó onboarding, redirigir
        navigate('/admin/ventas');
      } else if (response.data.data.currentStep) {
        // Continuar desde donde se quedó
        setCurrentStep(response.data.data.currentStep);
        setCompletedSteps(response.data.data.stepsCompleted || []);
        setSkippedSteps(response.data.data.skippedSteps || []);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  // Obtener productos de ejemplo
  const fetchSampleProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiBaseUrl}/api/onboarding/sample-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSampleProducts(response.data.data.products);
      }
    } catch (error) {
      console.error('Error fetching sample products:', error);
    }
  };

  // ✨ NUEVO: Obtener códigos de país
  const fetchCountryCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiBaseUrl}/api/onboarding/country-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCountryCodes(response.data.data.countryCodes);
      }
    } catch (error) {
      console.error('Error fetching country codes:', error);
      // Fallback a códigos básicos
      setCountryCodes([
        { code: '+52', country: 'México', flag: '🇲🇽' },
        { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' }
      ]);
    }
  };

  // Guardar progreso en backend
  const saveProgress = async (step, completed = [], skipped = []) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${apiBaseUrl}/api/onboarding/progress`,
        {
          currentStep: step,
          completedSteps: completed,
          skippedSteps: skipped
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Completar onboarding
  const completeOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiBaseUrl}/api/onboarding/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Mostrar confetti
      setShowConfetti(true);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/admin/ventas');
      }, 3000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  // ✨ NUEVO: Paso 0: Seleccionar Tipo de Negocio
  const handleStep0Submit = async () => {
    if (!businessType) {
      setMessage({ type: 'error', text: 'Por favor selecciona un tipo de negocio' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${apiBaseUrl}/api/onboarding/business-type`,
        { businessType },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // ✨ Actualizar tenantConfig en localStorage con el nuevo businessType
      if (response.data.success && response.data.data) {
        const tenantConfig = {
          businessType: response.data.data.businessType,
          isRestaurant: response.data.data.businessType === 'restaurant',
          restaurantConfig: response.data.data.restaurantConfig || null
        };
        localStorage.setItem('tenantConfig', JSON.stringify(tenantConfig));
      }

      const newCompletedSteps = [...completedSteps, 0];
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(1);
      await saveProgress(1, newCompletedSteps, skippedSteps);
      setMessage({ type: 'success', text: `¡Tipo de negocio seleccionado: ${getBusinessTypeName(businessType)}!` });
    } catch (error) {
      console.error('Error saving business type:', error);
      setMessage({ type: 'error', text: 'Error al guardar el tipo de negocio' });
    } finally {
      setLoading(false);
    }
  };

  // Helper: Obtener nombre legible del tipo de negocio
  const getBusinessTypeName = (type) => {
    const names = {
      restaurant: 'Restaurant',
      dark_kitchen: 'Dark Kitchen',
      supermarket: 'Supermercado'
    };
    return names[type] || type;
  };

  // Paso 1: Configurar Tienda
  const handleStep1Submit = async () => {
    if (!storeData.nombre) {
      setMessage({ type: 'error', text: 'El nombre del negocio es requerido' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');

      // ✨ Combinar código de país con número de teléfono
      const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';

      await axios.put(
        `${apiBaseUrl}/api/onboarding/store-config`,
        {
          ...storeData,
          telefono: fullPhone // ✨ Enviar teléfono completo con código de país
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const newCompletedSteps = [...completedSteps, 1];
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(2);
      await saveProgress(2, newCompletedSteps, skippedSteps);
      setMessage({ type: 'success', text: '¡Tienda configurada exitosamente!' });
    } catch (error) {
      console.error('Error configuring store:', error);
      setMessage({ type: 'error', text: 'Error al configurar la tienda' });
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Agregar Productos
  const handleStep2Submit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');

      // Solo cargar productos si el paso no ha sido completado
      if (productsOption === 'sample' && !completedSteps.includes(2)) {
        // Cargar productos de ejemplo
        await axios.post(
          `${apiBaseUrl}/api/onboarding/load-sample-products`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setMessage({ type: 'success', text: '¡Productos de ejemplo cargados!' });
      }

      const newCompletedSteps = completedSteps.includes(2) ? completedSteps : [...completedSteps, 2];
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(3);
      await saveProgress(3, newCompletedSteps, skippedSteps);
    } catch (error) {
      console.error('Error in step 2:', error);
      setMessage({ type: 'error', text: 'Error al procesar productos' });
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Invitar Equipo
  const handleStep3Submit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Si hay email y el paso no ha sido completado, crear el usuario vendedor
      if (teamEmail && !completedSteps.includes(3)) {
        const response = await fetch(`${apiBaseUrl}/api/onboarding/team-member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ email: teamEmail })
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage({ type: 'error', text: data.message || 'Error al crear usuario' });
          setLoading(false);
          return;
        }

        // Guardar datos del usuario creado para mostrar en paso 5
        setCreatedTeamMember({
          email: teamEmail,
          username: data.data.user.username,
          tempPassword: data.data.tempPassword
        });

        // Mostrar confirmación
        setMessage({
          type: 'success',
          text: `¡Usuario vendedor creado exitosamente!`
        });

        // Limpiar el campo de email después de crear el usuario
        setTeamEmail('');
      }

      const newCompletedSteps = completedSteps.includes(3) ? completedSteps : [...completedSteps, 3];
      setCompletedSteps(newCompletedSteps);
      setCurrentStep(4);
      await saveProgress(4, newCompletedSteps, skippedSteps);

    } catch (error) {
      console.error('Error in step 3:', error);
      setMessage({ type: 'error', text: 'Error al crear miembro del equipo' });
    } finally {
      setLoading(false);
    }
  };

  // Paso 4: Tutorial Primera Venta
  const handleStep4Submit = async () => {
    setLoading(true);

    try {
      const newCompletedSteps = [...completedSteps, 4];
      setCompletedSteps(newCompletedSteps);
      await completeOnboarding();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Saltar paso
  const handleSkipStep = async () => {
    if (!window.confirm('¿Seguro que quieres saltar este paso? Podrás configurarlo después desde Ajustes.')) {
      return;
    }

    const newSkippedSteps = [...skippedSteps, currentStep];
    setSkippedSteps(newSkippedSteps);

    const nextStep = currentStep + 1;
    if (nextStep > totalSteps) {
      await completeOnboarding();
    } else {
      setCurrentStep(nextStep);
      await saveProgress(nextStep, completedSteps, newSkippedSteps);
    }
  };

  // Volver al paso anterior
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold" style={{ color: '#23334e' }}>
              Configuración Inicial
            </h1>
            <span className="text-sm font-medium" style={{ color: '#697487' }}>
              Paso {currentStep + 1} de {totalSteps}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / totalSteps) * 100}%`,
                background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ✨ NUEVO: Step 0: Tipo de Negocio */}
          {currentStep === 0 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f3e8ff' }}>
                  <svg className="w-8 h-8" style={{ color: '#a855f7' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                  ¿Qué tipo de negocio tienes?
                </h2>
                <p style={{ color: '#697487' }}>
                  Selecciona el que mejor describa tu operación para personalizar tu experiencia
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {/* Restaurant */}
                <div
                  onClick={() => setBusinessType('restaurant')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    businessType === 'restaurant' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: businessType === 'restaurant' ? '#faf5ff' : 'white'
                  }}
                >
                  <div className="text-center">
                    <div className="mb-3 flex justify-center" style={{ color: '#a855f7' }}>
                      <Icons.restaurant />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#23334e' }}>Restaurant</h3>
                    <p className="text-sm mb-3" style={{ color: '#697487' }}>
                      Gestión de mesas, meseros, división de cuentas y propinas
                    </p>
                    <div className="text-xs space-y-1" style={{ color: '#697487' }}>
                      <div><Icons.checkmark /> Control de mesas</div>
                      <div><Icons.checkmark /> Cuentas abiertas</div>
                      <div><Icons.checkmark /> División de cuentas</div>
                      <div><Icons.checkmark /> Propinas</div>
                    </div>
                  </div>
                </div>

                {/* Dark Kitchen */}
                <div
                  onClick={() => setBusinessType('dark_kitchen')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    businessType === 'dark_kitchen' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: businessType === 'dark_kitchen' ? '#eff6ff' : 'white'
                  }}
                >
                  <div className="text-center">
                    <div className="mb-3 flex justify-center" style={{ color: '#3b82f6' }}>
                      <Icons.darkKitchen />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#23334e' }}>Dark Kitchen</h3>
                    <p className="text-sm mb-3" style={{ color: '#697487' }}>
                      Enfocado en delivery con tracking de órdenes y repartidores
                    </p>
                    <div className="text-xs space-y-1" style={{ color: '#697487' }}>
                      <div><Icons.checkmark /> Tracking de entregas</div>
                      <div><Icons.checkmark /> Gestión de repartidores</div>
                      <div><Icons.checkmark /> Órdenes para llevar</div>
                      <div><Icons.checkmark /> Reportes de delivery</div>
                    </div>
                  </div>
                </div>

                {/* Tienda/Retail */}
                <div
                  onClick={() => setBusinessType('supermarket')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    businessType === 'supermarket' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: businessType === 'supermarket' ? '#f0fdf4' : 'white'
                  }}
                >
                  <div className="text-center">
                    <div className="mb-3 flex justify-center" style={{ color: '#22c55e' }}>
                      <Icons.supermarket />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: '#23334e' }}>Tienda/Retail</h3>
                    <p className="text-sm mb-3" style={{ color: '#697487' }}>
                      Punto de venta rápido para comercios minoristas con control de inventario
                    </p>
                    <p className="text-xs mb-3 italic" style={{ color: '#8c95a4' }}>
                      Ideal para supermercados, papelerías, ferreterías, farmacias, fruterias, etc.
                    </p>
                    <div className="text-xs space-y-1" style={{ color: '#697487' }}>
                      <div><Icons.checkmark /> Códigos de barras y escaner</div>
                      <div><Icons.checkmark /> Ventas instantáneas</div>
                      <div><Icons.checkmark /> Control de inventario</div>
                      <div><Icons.checkmark /> Balanzas Electronicas</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje */}
              {message.text && (
                <div
                  className="mb-6 p-4 rounded-lg border-2"
                  style={{
                    backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: message.type === 'error' ? '#fecaca' : '#bbf7d0'
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: message.type === 'error' ? '#dc2626' : '#16a34a' }}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleStep0Submit}
                  disabled={loading || !businessType}
                  className="py-3 px-8 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                >
                  {loading ? 'Guardando...' : 'Continuar'}
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Configurar Tienda */}
          {currentStep === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                  <svg className="w-8 h-8" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                  Configura tu Negocio
                </h2>
                <p style={{ color: '#697487' }}>
                  Ingresa la información básica de tu negocio
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    required
                    value={storeData.nombre}
                    onChange={(e) => setStoreData({ ...storeData, nombre: e.target.value })}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#46546b' }}
                    placeholder="Mi Negocio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Dirección <span className="text-xs font-normal" style={{ color: '#8c95a4' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={storeData.direccion}
                    onChange={(e) => setStoreData({ ...storeData, direccion: e.target.value })}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#46546b' }}
                    placeholder="Av. Principal #123, Col. Centro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Teléfono <span className="text-xs font-normal" style={{ color: '#8c95a4' }}>(Opcional)</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Dropdown personalizado de códigos de país con banderas */}
                    <div className="relative" style={{ minWidth: '160px' }} ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 flex items-center justify-between"
                        style={{ '--tw-ring-color': '#46546b' }}
                      >
                        <span className="flex items-center gap-2">
                          <span style={{ fontSize: '1.25rem' }}>
                            {countryCodes.find(c => c.code === countryCode)?.flag || <Icons.flag />}
                          </span>
                          <span className="font-medium" style={{ color: '#23334e' }}>
                            {countryCode}
                          </span>
                        </span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Dropdown menu */}
                      {showCountryDropdown && (
                        <div
                          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          style={{ top: '100%' }}
                        >
                          {countryCodes.map((country, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setCountryCode(country.code);
                                setShowCountryDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors"
                              style={countryCode === country.code ? { backgroundColor: '#f3f4f6' } : {}}
                            >
                              <span style={{ fontSize: '1.25rem' }}>{country.flag}</span>
                              <span className="font-medium" style={{ color: '#23334e' }}>{country.code}</span>
                              <span className="text-sm" style={{ color: '#697487' }}>({country.country})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Input para el número */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Solo permitir números
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneNumber(value);
                      }}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#46546b' }}
                      placeholder="5551234567"
                      maxLength={15}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#8c95a4' }}>
                    Ejemplo: {countryCode} 5551234567
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    RFC <span className="text-xs font-normal" style={{ color: '#8c95a4' }}>(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={storeData.rfc}
                    onChange={(e) => setStoreData({ ...storeData, rfc: e.target.value.toUpperCase() })}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#46546b' }}
                    placeholder="XAXX010101000"
                    maxLength={13}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#8c95a4' }}>
                  Vista Previa del Ticket:
                </p>
                <div className="text-center">
                  <p className="font-bold" style={{ color: '#23334e' }}>
                    {storeData.nombre || 'Nombre del Negocio'}
                  </p>
                  {storeData.rfc && (
                    <p className="text-xs" style={{ color: '#697487' }}>
                      RFC: {storeData.rfc}
                    </p>
                  )}
                  {storeData.direccion && (
                    <p className="text-xs" style={{ color: '#697487' }}>
                      {storeData.direccion}
                    </p>
                  )}
                  {phoneNumber && (
                    <p className="text-xs" style={{ color: '#697487' }}>
                      Tel: {countryCode} {phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Información de Impresión */}
              {(businessType === 'restaurant' || businessType === 'dark_kitchen' || businessType === 'supermarket') && (
                <div className="mt-6 p-4 rounded-lg border-l-4 border-blue-400" style={{ backgroundColor: '#eff6ff' }}>
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-2">Impresión de Tickets</h3>
                      <p className="text-sm text-blue-800 mb-3">
                        Astrodish soporta dos modos de impresión para adaptarse a tus necesidades:
                      </p>
                      <div className="space-y-2 text-sm text-blue-800">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <strong>Diálogo del Navegador:</strong> Funciona inmediatamente, puedes imprimir en cualquier impresora conectada. Ideal para comenzar rápido.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <strong>Impresión Directa:</strong> Para impresoras térmicas. Imprime automáticamente sin diálogos. Requiere instalar <a href="https://github.com/yourusername/astrodish/releases" target="_blank" rel="noopener noreferrer" className="underline font-medium">Astrodish Print Server</a>.
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-700 mt-3 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Puedes configurar la impresión más tarde en <strong>Configuración → Tiendas → Impresión</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {message.text && (
                <div
                  className="mt-6 rounded-lg border p-4"
                  style={{
                    backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: message.type === 'error' ? '#fecaca' : '#bbf7d0'
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: message.type === 'error' ? '#dc2626' : '#16a34a' }}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="py-3 px-6 rounded-lg font-semibold transition-all duration-200 border-2"
                  style={{ borderColor: '#d1d5db', color: '#697487' }}
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleStep1Submit}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                >
                  {loading ? 'Guardando...' : 'Continuar'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Agregar Productos */}
          {currentStep === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                  <svg className="w-8 h-8" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                  Agrega tus Productos
                </h2>
                <p style={{ color: '#697487' }}>
                  Elige cómo quieres empezar tu inventario
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Opción: Productos de Ejemplo */}
                <div
                  onClick={() => setProductsOption('sample')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    productsOption === 'sample' ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: productsOption === 'sample' ? '#eff6ff' : 'white'
                  }}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        productsOption === 'sample' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {productsOption === 'sample' && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium" style={{ color: '#23334e' }}>
                        Cargar Productos de Ejemplo
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#697487' }}>
                        8 productos comunes para empezar rápido {businessType === 'restaurant' || businessType === 'dark_kitchen'
                          ? '(Boneless, Hamburguesa, Pizza, etc.)'
                          : '(Coca-Cola, Pan, Leche, etc.)'}
                      </p>
                      {productsOption === 'sample' && sampleProducts.length > 0 && (
                        <div className="mt-3 text-xs" style={{ color: '#697487' }}>
                          <p className="font-medium mb-1">Productos que se agregarán:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {sampleProducts.slice(0, 3).map((product, index) => (
                              <li key={index}>{product.name} - ${product.price}</li>
                            ))}
                            <li>... y {sampleProducts.length - 3} más</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Opción: Agregar Manualmente */}
                <div
                  onClick={() => setProductsOption('manual')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    productsOption === 'manual' ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: productsOption === 'manual' ? '#eff6ff' : 'white'
                  }}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        productsOption === 'manual' ? 'border-blue-500' : 'border-gray-300'
                      }`}>
                        {productsOption === 'manual' && (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="font-medium" style={{ color: '#23334e' }}>
                        Agregar Manualmente Después
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#697487' }}>
                        Continuaré sin productos y los agregaré más tarde
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {message.text && (
                <div
                  className="mb-6 rounded-lg border p-4"
                  style={{
                    backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: message.type === 'error' ? '#fecaca' : '#bbf7d0'
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: message.type === 'error' ? '#dc2626' : '#16a34a' }}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-lg font-semibold border-2 transition-all"
                  style={{ color: '#23334e', borderColor: '#23334e' }}
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleStep2Submit}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                >
                  {loading ? 'Procesando...' : 'Continuar'}
                </button>
                <button
                  onClick={handleSkipStep}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#697487', borderColor: '#e5e7eb' }}
                >
                  Saltar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Invitar Equipo */}
          {currentStep === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e0e7ff' }}>
                  <svg className="w-8 h-8" style={{ color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                  Invita a tu Equipo
                </h2>
                <p style={{ color: '#697487' }}>
                  Opcional: Agrega colaboradores para que te ayuden
                </p>
              </div>

              {createdTeamMember ? (
                <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #22c55e' }}>
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 mr-2" style={{ color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="font-medium" style={{ color: '#16a34a' }}>Miembro del equipo creado</p>
                  </div>
                  <div className="space-y-1 text-sm" style={{ color: '#15803d' }}>
                    <p><strong>Email:</strong> {createdTeamMember.email}</p>
                    <p><strong>Usuario:</strong> {createdTeamMember.username}</p>
                  </div>
                  <p className="text-xs mt-3" style={{ color: '#8c95a4' }}>
                    Podrás editar este usuario y agregar más miembros después desde la sección de Usuarios
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                    Email del Miembro del Equipo
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="email"
                      value={teamEmail}
                      onChange={(e) => setTeamEmail(e.target.value)}
                      className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': '#46546b' }}
                      placeholder="empleado@ejemplo.com"
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#8c95a4' }}>
                    Podrás agregar más miembros después desde la sección de Usuarios
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg mb-6" style={{ backgroundColor: '#f0f9ff', border: '1px solid #3b82f6' }}>
                <div className="flex">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#1e40af' }}>
                      Puedes saltar este paso
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#3b82f6' }}>
                      La gestión de equipo está disponible en tu plan. Puedes agregar miembros cuando lo necesites.
                    </p>
                  </div>
                </div>
              </div>

              {message.text && (
                <div
                  className="mb-6 rounded-lg border p-4"
                  style={{
                    backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    borderColor: message.type === 'error' ? '#fecaca' : '#bbf7d0'
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: message.type === 'error' ? '#dc2626' : '#16a34a' }}
                  >
                    {message.text}
                  </p>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-lg font-semibold border-2 transition-all"
                  style={{ color: '#23334e', borderColor: '#23334e' }}
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleStep3Submit}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                >
                  {loading ? 'Procesando...' : 'Continuar'}
                </button>
                <button
                  onClick={handleSkipStep}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-semibold border-2 transition-all hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#697487', borderColor: '#e5e7eb' }}
                >
                  Saltar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Tutorial Primera Venta */}
          {currentStep === 4 && (
            <div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                  <svg className="w-8 h-8" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                  ¡Casi Listo!
                </h2>
                <p style={{ color: '#697487' }}>
                  Tu tienda está configurada y lista para vender
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                  <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                    ¿Qué sigue?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium" style={{ color: '#23334e' }}>Hacer tu Primera Venta</p>
                        <p className="text-sm" style={{ color: '#697487' }}>Ve a Ventas y escanea o busca un producto</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium" style={{ color: '#23334e' }}>Administra tu Inventario</p>
                        <p className="text-sm" style={{ color: '#697487' }}>Agrega, edita o elimina productos desde Productos</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium" style={{ color: '#23334e' }}>Revisa tus Reportes</p>
                        <p className="text-sm" style={{ color: '#697487' }}>Consulta tus ventas y métricas en tiempo real</p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Información del usuario creado */}
                {createdTeamMember && (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: '#2563eb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: '#1e40af' }}>
                          Usuario Vendedor Creado
                        </p>
                        <div className="mt-2 space-y-1 text-xs" style={{ color: '#1e3a8a' }}>
                          <p><strong>Email:</strong> {createdTeamMember.email}</p>
                          <p><strong>Usuario:</strong> {createdTeamMember.username}</p>
                          <p className="flex items-center">
                            <strong>Contraseña temporal:</strong>
                            <code className="ml-2 px-2 py-0.5 bg-white rounded font-mono text-sm">{createdTeamMember.tempPassword}</code>
                          </p>
                        </div>
                        <p className="mt-2 text-xs flex items-center gap-1" style={{ color: '#3b82f6' }}>
                          <Icons.warning /> Guarda esta contraseña y compártela con tu empleado. Deberá cambiarla en su primer inicio de sesión.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
                  <div className="flex">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                        Consejo Rápido
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#b45309' }}>
                        Usa el lector de código de barras para agregar productos más rápido durante las ventas
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-3 rounded-lg font-semibold border-2 transition-all"
                  style={{ color: '#23334e', borderColor: '#23334e' }}
                >
                  ← Atrás
                </button>
                <button
                  onClick={handleStep4Submit}
                  disabled={loading}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50 transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}
                >
                  {loading ? 'Finalizando...' : (
                    <>
                      <Icons.party /> Empezar a Vender
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Celebration Screen */}
          {showConfetti && (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                <svg className="w-12 h-12" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2" style={{ color: '#23334e' }}>
                ¡Felicidades! <Icons.celebration />
              </h2>
              <p className="text-lg mb-6" style={{ color: '#697487' }}>
                Tu tienda está lista para vender
              </p>
              <p className="text-sm" style={{ color: '#8c95a4' }}>
                Redirigiendo al panel de ventas...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
