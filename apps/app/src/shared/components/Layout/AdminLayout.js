import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import logo from "../../../assets/astrodishlogo2_blank.png";
import apiBaseUrl, { API_ENDPOINTS, getAuthHeaders } from "../../../config/api";
import { useLicense } from "../../contexts/LicenseContext";
import { useTurno } from "../../../core/turnos/hooks/useTurno";
import IniciarTurnoModal from "../../../core/turnos/components/IniciarTurnoModal";
import CerrarTurnoModal from "../../../core/turnos/components/CerrarTurnoModal";

// SVG Icons - AstroDish Design System
const Icons = {
  // Status icons
  lock: () => <svg className="w-16 h-16 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>,
  warning: () => <svg className="w-16 h-16 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>,
  circleGreen: () => <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>,
  circleRed: () => <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
  </svg>,
  // Navigation category icons
  money: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  cart: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>,
  user: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>,
  return: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>,
  location: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  clipboard: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>,
  restaurant: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>,
  chef: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>,
  cooking: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>,
  chair: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>,
  settings: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>,
  store: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>,
  package: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>,
  cash: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>,
  creditCard: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>,
  users: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>,
  worker: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>,
  document: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>,
  vacation: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
  </svg>,
  chart: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>,
  calendar: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>,
  clock: () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
};

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRestaurant, setIsRestaurant] = useState(false); // ✨ NUEVO: Estado para tipo de negocio
  const { isModuleEnabled, loading: licenseLoading } = useLicense();

  // Estados para modales de turno
  const [showIniciarTurnoModal, setShowIniciarTurnoModal] = useState(false);
  const [showCerrarTurnoModal, setShowCerrarTurnoModal] = useState(false);
  const [tiendaSeleccionadaActual, setTiendaSeleccionadaActual] = useState(null);

  // Hook de turno
  const { turnoActivo, refetch: refetchTurno } = useTurno();

  // Escuchar evento de cambio de tienda para actualizar turno
  useEffect(() => {
    const handleTiendaChanged = (event) => {
      const { tiendaId } = event.detail;
      // Guardar la tienda seleccionada
      setTiendaSeleccionadaActual(tiendaId);
      // Actualizar el turno activo para la nueva tienda seleccionada
      refetchTurno(tiendaId);
    };

    window.addEventListener('tiendaChanged', handleTiendaChanged);

    return () => {
      window.removeEventListener('tiendaChanged', handleTiendaChanged);
    };
  }, [refetchTurno]);

  // ✅ NUEVO: CSS personalizado para scrollbars corporativos
  useEffect(() => {
    // Inyectar estilos CSS personalizados para scrollbars más corporativos
    const style = document.createElement('style');
    style.textContent = `
      /* ✅ Scrollbar corporativo principal */
      .corporate-scroll::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      .corporate-scroll::-webkit-scrollbar-track {
        background: rgba(244, 246, 250, 0.3);
        border-radius: 4px;
        margin: 4px;
      }
      
      .corporate-scroll::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #8c95a4 0%, #697487 100%);
        border-radius: 4px;
        border: 1px solid rgba(244, 246, 250, 0.2);
        transition: all 0.3s ease;
      }
      
      .corporate-scroll::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #697487 0%, #46546b 100%);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .corporate-scroll::-webkit-scrollbar-corner {
        background: transparent;
      }
      
      /* ✅ Scrollbar oscuro para sidebar */
      .dark-scroll::-webkit-scrollbar {
        width: 6px;
      }
      
      .dark-scroll::-webkit-scrollbar-track {
        background: rgba(70, 84, 107, 0.2);
        border-radius: 3px;
        margin: 4px;
      }
      
      .dark-scroll::-webkit-scrollbar-thumb {
        background: rgba(140, 149, 164, 0.6);
        border-radius: 3px;
        transition: all 0.3s ease;
      }
      
      .dark-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(244, 246, 250, 0.8);
        box-shadow: 0 0 6px rgba(244, 246, 250, 0.3);
      }
      
      /* ✅ Efectos de smooth scroll */
      .smooth-scroll {
        scroll-behavior: smooth;
        scrollbar-gutter: stable;
      }
      
      /* ✅ Fade effect en los bordes del scroll */
      .scroll-fade {
        position: relative;
      }
      
      .scroll-fade::before {
        content: '';
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        height: 20px;
        background: linear-gradient(to bottom, rgba(244, 246, 250, 1) 0%, rgba(244, 246, 250, 0) 100%);
        z-index: 10;
        pointer-events: none;
      }
      
      .scroll-fade::after {
        content: '';
        position: sticky;
        bottom: 0;
        left: 0;
        right: 0;
        height: 20px;
        background: linear-gradient(to top, rgba(244, 246, 250, 1) 0%, rgba(244, 246, 250, 0) 100%);
        z-index: 10;
        pointer-events: none;
      }
      
      /* ✅ Scroll indicators */
      .scroll-indicator {
        background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(35, 51, 78, 0.05) 50%,
          transparent 100%
        );
      }
      
      /* ✅ Firefox scrollbar styling */
      .corporate-scroll {
        scrollbar-width: thin;
        scrollbar-color: #8c95a4 rgba(244, 246, 250, 0.3);
      }
      
      .dark-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(140, 149, 164, 0.6) rgba(70, 84, 107, 0.2);
      }
      
      /* ✅ Animaciones suaves para hover */
      .scroll-smooth-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    verifyAuth();
  }, []);

  // Verificar estado de onboarding después de autenticación
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Solo verificar si el usuario ya está autenticado y no está cargando
      if (!currentUser || loading) return;

      try {
        const response = await axios.get(`${apiBaseUrl}/api/onboarding/status`, {
          headers: getAuthHeaders()
        });

        const { completed } = response.data.data;

        // Si el onboarding no está completado, redirigir
        if (!completed) {
          console.log('Onboarding no completado, redirigiendo...');
          navigate('/onboarding', { replace: true });
        }
      } catch (error) {
        console.error('Error verificando estado de onboarding:', error);
        // Si falla la verificación, permitir continuar (evitar bloqueos)
      }
    };

    checkOnboardingStatus();
  }, [currentUser, loading, navigate]);

  const verifyAuth = async () => {
    try {
      console.log('Verificando autenticación en AdminLayout...');
      setLoading(true);
      setAuthError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        console.log('No hay token');
        handleAuthError('No hay sesión activa');
        return;
      }

      // Verificar si el token está expirado
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
          console.log('Token expirado');
          handleAuthError('Sesión expirada');
          return;
        }
      } catch (e) {
        console.log('Token malformado');
        handleAuthError('Token inválido');
        return;
      }

      // Obtener datos del usuario actual desde localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('Usuario desde localStorage:', user);

        // SEGURIDAD: Verificar si el usuario debe cambiar su contraseña
        if (user.mustChangePassword && location.pathname !== '/change-password') {
          console.log('Usuario debe cambiar contraseña, redirigiendo...');
          navigate('/change-password', { replace: true });
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        // ✨ NUEVO: Cargar configuración del tenant desde localStorage
        const storedTenantConfig = localStorage.getItem("tenantConfig");
        if (storedTenantConfig) {
          const tenantConfig = JSON.parse(storedTenantConfig);
          setIsRestaurant(tenantConfig.businessType === 'restaurant');
        }

        setLoading(false);
        return;
      }

      // Si no hay usuario en localStorage, obtener desde el servidor
      console.log('Obteniendo usuario desde servidor...');
      const response = await axios.get(`${apiBaseUrl}${API_ENDPOINTS.auth.profile}`, {
        headers: getAuthHeaders()
      });

      console.log('Usuario obtenido del servidor:', response.data);
      const userData = response.data.user || response.data;

      // SEGURIDAD: Verificar si el usuario debe cambiar su contraseña
      if (userData.mustChangePassword && location.pathname !== '/change-password') {
        console.log('Usuario debe cambiar contraseña, redirigiendo...');
        localStorage.setItem("user", JSON.stringify(userData));
        navigate('/change-password', { replace: true });
        setLoading(false);
        return;
      }

      setCurrentUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", userData.role);

      // ✨ NUEVO: Guardar información del tenant
      if (userData.tenant) {
        setIsRestaurant(userData.tenant.businessType === 'restaurant');
        localStorage.setItem("tenantConfig", JSON.stringify(userData.tenant));
      }

    } catch (error) {
      console.error('Error verificando auth:', error);

      if (error.response?.status === 401) {
        handleAuthError('Sesión expirada');
      } else if (error.response?.status === 403) {
        handleAuthError('Acceso denegado');
      } else {
        handleAuthError('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (message) => {
    setAuthError(message);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("tenantConfig");

    // Redirigir al login después de un breve delay
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("tenantConfig");
    window.location.href = "/";
  };

  // Función helper para verificar roles
  const isAdmin = () => {
    return currentUser?.role === "admin";
  };

  // Función helper para verificar si tiene acceso a corte de caja
  const hasAccessToCaja = () => {
    return currentUser?.role === "admin" || currentUser?.role === "vendedor";
  };

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

  // Categorías de navegación
  const navigationCategories = {
    ventas: {
      title: "Ventas y Clientes",
      icon: Icons.money,
      items: [
        { path: "/admin/ventas", title: "Punto de Venta", icon: Icons.cart, roles: ["all"], module: null },
        { path: "/admin/clientes", title: "Clientes", icon: Icons.user, roles: ["all"], module: "clientes" },
        { path: "/admin/devoluciones", title: "Devoluciones", icon: Icons.return, roles: ["all"], module: null },
        { path: "/admin/seguimiento-pedidos", title: "Seguimiento", icon: Icons.location, roles: ["all"], module: null, hideForBusinessTypes: ["supermarket"] },
        { path: "/admin/ordenes", title: "Órdenes de Compra", icon: Icons.clipboard, roles: ["all"], module: null }
      ]
    },
    restaurant: {
      title: "Restaurant",
      icon: Icons.restaurant,
      items: [
        { path: "/restaurant/waiter", title: "Dashboard Mesero", icon: Icons.chef, roles: ["all"], module: null },
        { path: "/restaurant/kitchen", title: "Cocina", icon: Icons.cooking, roles: ["all"], module: null },
        { path: "/restaurant/tables", title: "Gestión de Mesas", icon: Icons.chair, roles: ["admin"], module: null }
      ]
    },
    gestion: {
      title: "Gestión del Negocio",
      icon: Icons.settings,
      items: [
        { path: "/admin/tiendas", title: "Tiendas", icon: Icons.store, roles: ["admin"], module: "tiendas" },
        { path: "/admin/productos", title: "Productos", icon: Icons.package, roles: ["admin"], module: null },
        { path: "/admin/gastos", title: "Gastos", icon: Icons.cash, roles: ["all"], module: null },
        { path: "/admin/caja", title: "Corte de Caja", icon: Icons.creditCard, roles: ["admin", "vendedor"], module: null }
      ]
    },
    rrhh: {
      title: "Recursos Humanos",
      icon: Icons.users,
      items: [
        { path: "/admin/usuarios", title: "Usuarios", icon: Icons.users, roles: ["admin"], module: null },
        { path: "/admin/empleados", title: "Empleados", icon: Icons.worker, roles: ["all"], module: "empleados" },
        { path: "/admin/historial-empleados", title: "Historial Laboral", icon: Icons.document, roles: ["admin"], module: "empleados" },
        { path: "/admin/vacaciones", title: "Vacaciones", icon: Icons.vacation, roles: ["admin"], module: "vacaciones" }
      ]
    },
    reportes: {
      title: "Reportes y Análisis",
      icon: Icons.chart,
      items: [
        { path: "/admin/reportes", title: "Reportes", icon: Icons.chart, roles: ["admin"], module: "reportes" }
      ]
    }
  };

  // Filtrar items según el rol del usuario, la licencia y el tipo de negocio
  const filterItemsByRole = (items) => {
    // Primero filtrar por rol
    let filteredItems = items;
    if (!isAdmin()) {
      // Para usuarios que no son admin, mostrar items que incluyen "all" o el rol específico del usuario
      filteredItems = items.filter(item =>
        item.roles.includes("all") || item.roles.includes(currentUser?.role)
      );
    }

    // ✨ NUEVO: Filtrar por tipo de negocio
    const tenantConfigStr = localStorage.getItem('tenantConfig');
    if (tenantConfigStr) {
      try {
        const tenantConfig = JSON.parse(tenantConfigStr);
        const businessType = tenantConfig.businessType;

        filteredItems = filteredItems.filter(item => {
          // Si el item tiene hideForBusinessTypes, verificar si el tipo actual está en la lista
          if (item.hideForBusinessTypes && Array.isArray(item.hideForBusinessTypes)) {
            return !item.hideForBusinessTypes.includes(businessType);
          }
          return true;
        });
      } catch (error) {
        console.error('Error al filtrar por businessType:', error);
      }
    }

    // Si la licencia aún está cargando, mostrar todos los items (evitar pantalla vacía)
    if (licenseLoading) {
      return filteredItems;
    }

    // Luego filtrar por licencia
    const finalItems = filteredItems.filter(item => {
      // Si no requiere módulo específico (null), siempre está disponible
      if (!item.module) return true;

      // Si requiere módulo, verificar si está habilitado en la licencia
      return isModuleEnabled(item.module);
    });

    return finalItems;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4" style={{ borderColor: '#f4f6fa', borderTopColor: 'transparent' }}></div>
          <p className="text-lg text-white">Verificando autenticación...</p>
          <p className="text-sm mt-2" style={{ color: '#8c95a4' }}>Por favor espera un momento</p>
        </div>
      </div>
    );
  }

  // Error state
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)' }}>
        <div className="text-center p-8 rounded-xl shadow-2xl max-w-md" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="mb-4" style={{ color: '#2b354f' }}>{Icons.lock()}</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2b354f' }}>Error de Autenticación</h2>
          <p className="mb-4" style={{ color: '#697487' }}>{authError}</p>
          <div className="animate-pulse text-sm" style={{ color: '#8c95a4' }}>Redirigiendo al login...</div>
        </div>
      </div>
    );
  }

  // No user data
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)' }}>
        <div className="text-center p-8 rounded-xl shadow-2xl max-w-md" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="mb-4" style={{ color: '#2b354f' }}>{Icons.warning()}</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#2b354f' }}>Usuario no encontrado</h2>
          <p style={{ color: '#697487' }}>No se pudieron cargar los datos del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex" style={{ backgroundColor: '#f4f6fa' }}>
      {/* ✅ SIDEBAR MEJORADO - con scroll corporativo oscuro */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-80'} shadow-2xl border-r transition-all duration-300 ease-in-out flex flex-col fixed left-0 top-0 h-full z-30`}
             style={{
               backgroundColor: '#2b354f',
               borderRightColor: '#5e85e0',
               boxShadow: '4px 0 20px rgba(94, 133, 224, 0.15)'
             }}>
        
        {/* Header del sidebar */}
        <div className="p-6 border-b flex-shrink-0" style={{ borderBottomColor: '#5e85e0' }}>
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <img src={logo} alt="AstroDish POS" className="w-12 h-12 rounded-lg shadow-lg bg-white/10 p-2" />
                <div>
                  <h1 className="text-xl font-bold text-white">AstroDish POS</h1>
                  <p className="text-sm" style={{ color: '#8c95a4' }}>Panel de Control</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg transition-all duration-200 scroll-smooth-transition"
              style={{ color: '#8c95a4' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(140, 149, 164, 0.1)';
                e.target.style.color = '#f4f6fa';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#8c95a4';
                e.target.style.transform = 'scale(1)';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Información del usuario */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b flex-shrink-0" style={{ borderBottomColor: '#5e85e0', backgroundColor: 'rgba(43, 53, 79, 0.3)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg scroll-smooth-transition"
                   style={{ background: 'linear-gradient(135deg, #f4f6fa 0%, #8c95a4 100%)', color: '#2b354f' }}>
                {currentUser.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-white">{currentUser.nombre}</p>
                <p className="text-sm capitalize" style={{ color: '#8c95a4' }}>{currentUser.role}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs" style={{ color: '#8c95a4' }}>En línea</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información del sistema */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b flex-shrink-0" style={{ borderBottomColor: '#5e85e0' }}>
            <div className="text-xs space-y-1" style={{ color: '#8c95a4' }}>
              <div className="flex items-center gap-2">
                {Icons.calendar()} <span>{date}</span>
              </div>
              <div className="flex items-center gap-2">
                {Icons.clock()} <span>{time}</span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NAVEGACIÓN MEJORADA - con scroll corporativo oscuro y efectos */}
        <nav className="flex-1 p-4 overflow-y-auto dark-scroll smooth-scroll scroll-smooth-transition">
          {/* ✅ Indicador de scroll superior */}
          <div className="scroll-indicator h-1 mb-2 rounded-full opacity-50"></div>
          
          {Object.entries(navigationCategories)
            // ✨ NUEVO: Filtrar categoría de restaurant si no es tipo restaurant
            .filter(([key, category]) => {
              if (key === 'restaurant' && !isRestaurant) {
                return false; // Ocultar categoría de restaurant
              }
              return true;
            })
            .map(([key, category]) => {
            const filteredItems = filterItemsByRole(category.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={key} className="mb-6">
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2 scroll-smooth-transition flex items-center gap-2" style={{ color: '#8c95a4' }}>
                    {category.icon()}
                    {category.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {filteredItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg scroll-smooth-transition ${
                        location.pathname === item.path
                          ? "shadow-lg border-l-4"
                          : ""
                      }`}
                      style={location.pathname === item.path
                        ? {
                            background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)',
                            color: 'white',
                            borderLeftColor: '#f4f6fa',
                            boxShadow: '0 4px 12px rgba(43, 53, 79, 0.3)'
                          }
                        : { color: '#8c95a4' }
                      }
                      onMouseEnter={(e) => {
                        if (location.pathname !== item.path) {
                          e.target.style.backgroundColor = 'rgba(140, 149, 164, 0.1)';
                          e.target.style.color = '#f4f6fa';
                          e.target.style.transform = 'translateX(4px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location.pathname !== item.path) {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#8c95a4';
                          e.target.style.transform = 'translateX(0)';
                        }
                      }}
                      title={sidebarCollapsed ? item.title : undefined}
                    >
                      <span className="mr-3">{item.icon()}</span>
                      {!sidebarCollapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!sidebarCollapsed && location.pathname === item.path && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* ✅ Indicador de scroll inferior */}
          <div className="scroll-indicator h-1 mt-2 rounded-full opacity-50"></div>
        </nav>

        {/* Footer del sidebar */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderTopColor: '#5e85e0' }}>
          <button
            onClick={handleLogout}
            className={`${sidebarCollapsed ? 'w-12 h-12 justify-center' : 'w-full'} flex items-center px-4 py-3 text-sm font-medium rounded-lg scroll-smooth-transition`}
            style={{ color: '#8c95a4' }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.target.style.color = '#f87171';
              e.target.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#8c95a4';
              e.target.style.transform = 'scale(1)';
            }}
            title={sidebarCollapsed ? "Cerrar Sesión" : undefined}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && "Cerrar Sesión"}
          </button>
        </div>
      </aside>

      {/* ✅ CONTENIDO PRINCIPAL MEJORADO - con scroll corporativo */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
        {/* Header principal - FIJO con mejor sombra */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 z-20"
                style={{
                  boxShadow: '0 2px 10px rgba(35, 51, 78, 0.08)',
                  borderBottomColor: 'rgba(35, 51, 78, 0.1)'
                }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold scroll-smooth-transition" style={{ color: '#2b354f' }}>
                {location.pathname === '/admin/ventas' && 'Punto de Venta'}
                {location.pathname === '/admin/clientes' && 'Gestión de Clientes'}
                {location.pathname === '/admin/productos' && 'Gestión de Productos'}
                {location.pathname === '/admin/reportes' && 'Reportes y Análisis'}
                {location.pathname === '/admin/caja' && 'Corte de Caja'}
                {location.pathname === '/admin/empleados' && 'Gestión de Empleados'}
                {location.pathname === '/admin/vacaciones' && 'Gestión de Vacaciones'}
                {location.pathname === '/admin/usuarios' && 'Gestión de Usuarios'}
                {location.pathname === '/admin/tiendas' && 'Gestión de Tiendas'}
                {location.pathname === '/admin/gastos' && 'Gestión de Gastos'}
                {location.pathname === '/admin/historial-empleados' && 'Historial de Empleados'}
                {location.pathname === '/admin/devoluciones' && 'Devoluciones'}
                {location.pathname === '/admin/seguimiento-pedidos' && 'Seguimiento de Pedidos'}
                {location.pathname === '/admin/ordenes' && 'Órdenes de Compra'}
                {location.pathname === '/restaurant/tables' && 'Gestión de Mesas'}
                {location.pathname === '/restaurant/waiter' && 'Dashboard de Mesero'}
                {location.pathname.startsWith('/restaurant/account/') && 'Cuenta de Mesa'}
              </h1>
              <p className="text-sm mt-1" style={{ color: '#697487' }}>
                {date} • {time}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Botón de Control de Turno */}
              <button
                onClick={() => turnoActivo ? setShowCerrarTurnoModal(true) : setShowIniciarTurnoModal(true)}
                className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                style={turnoActivo
                  ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }
                  : { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }
                }
                title={turnoActivo && turnoActivo.usuario?.username ? `Turno abierto por ${turnoActivo.usuario.username}` : ''}
              >
                {turnoActivo ? <><span style={{ color: '#22c55e' }}>{Icons.circleGreen()}</span> Turno: Abierto</> : <><span style={{ color: '#ef4444' }}>{Icons.circleRed()}</span> Turno: Cerrado</>}
              </button>

              {/* Avatar del usuario */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg scroll-smooth-transition"
                     style={{ background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)' }}
                     onMouseEnter={(e) => {
                       e.target.style.transform = 'scale(1.1)';
                       e.target.style.boxShadow = '0 6px 20px rgba(43, 53, 79, 0.3)';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.transform = 'scale(1)';
                       e.target.style.boxShadow = '0 4px 6px rgba(43, 53, 79, 0.1)';
                     }}>
                  {currentUser.nombre?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ✅ CONTENIDO CON SCROLL CORPORATIVO MEJORADO */}
        <div className={`flex-1 ${location.pathname === '/admin/ventas' ? 'overflow-hidden' : 'overflow-y-auto corporate-scroll smooth-scroll scroll-fade p-6'}`}
             style={{ backgroundColor: '#f4f6fa', height: location.pathname === '/admin/ventas' ? 'calc(100vh - 80px)' : 'auto' }}>
          <div className="max-w-full h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Modales de Turno */}
      {showIniciarTurnoModal && (
        <IniciarTurnoModal
          onClose={() => setShowIniciarTurnoModal(false)}
          onSuccess={(turno) => {
            setShowIniciarTurnoModal(false);
            // Guardar la tienda del turno iniciado
            if (turno && turno.tienda) {
              const tiendaId = typeof turno.tienda === 'object' ? turno.tienda._id : turno.tienda;
              setTiendaSeleccionadaActual(tiendaId);
              // Refrescar con la tienda del turno recién iniciado
              refetchTurno(tiendaId);
            } else {
              // Si no hay tienda en el turno, refrescar sin parámetro
              refetchTurno(tiendaSeleccionadaActual);
            }
          }}
        />
      )}

      {showCerrarTurnoModal && turnoActivo && (
        <CerrarTurnoModal
          turno={turnoActivo}
          onClose={() => setShowCerrarTurnoModal(false)}
          onSuccess={(turno) => {
            setShowCerrarTurnoModal(false);
            // Si hay una tienda seleccionada, refrescar con esa tienda
            // Si no, refrescar sin parámetro (busca turno del usuario)
            refetchTurno(tiendaSeleccionadaActual);
            // Navegar a la página de corte de caja si el usuario es admin o vendedor
            if (hasAccessToCaja()) {
              navigate(`/admin/caja?turnoId=${turno._id}`);
            }
            // Para repartidores, se quedan en la página actual
          }}
        />
      )}
    </div>
  );
}