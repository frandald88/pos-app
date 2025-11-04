import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import logo from "../../../assets/logo.png";
import apiBaseUrl, { API_ENDPOINTS, getAuthHeaders } from "../../../config/api";
import { useLicense } from "../../contexts/LicenseContext";
import { useTurno } from "../../../core/turnos/hooks/useTurno";
import IniciarTurnoModal from "../../../core/turnos/components/IniciarTurnoModal";
import CerrarTurnoModal from "../../../core/turnos/components/CerrarTurnoModal";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const verifyAuth = async () => {
    try {
      console.log('🔍 Verificando autenticación en AdminLayout...');
      setLoading(true);
      setAuthError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        console.log('❌ No hay token');
        handleAuthError('No hay sesión activa');
        return;
      }

      // Verificar si el token está expirado
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          console.log('❌ Token expirado');
          handleAuthError('Sesión expirada');
          return;
        }
      } catch (e) {
        console.log('❌ Token malformado');
        handleAuthError('Token inválido');
        return;
      }

      // Obtener datos del usuario actual desde localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        console.log('✅ Usuario desde localStorage:', user);
        setCurrentUser(user);
        setLoading(false);
        return;
      }

      // Si no hay usuario en localStorage, obtener desde el servidor
      console.log('📡 Obteniendo usuario desde servidor...');
      const response = await axios.get(`${apiBaseUrl}${API_ENDPOINTS.auth.profile}`, {
        headers: getAuthHeaders()
      });

      console.log('✅ Usuario obtenido del servidor:', response.data);
      const userData = response.data.user || response.data;
      
      setCurrentUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("userRole", userData.role);

    } catch (error) {
      console.error('❌ Error verificando auth:', error);
      
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
    
    // Redirigir al login después de un breve delay
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  };

  const handleLogout = () => {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
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
      icon: "💰",
      items: [
        { path: "/admin/ventas", title: "Punto de Venta", icon: "🛒", roles: ["all"], module: null },
        { path: "/admin/clientes", title: "Clientes", icon: "👤", roles: ["all"], module: "clientes" },
        { path: "/admin/devoluciones", title: "Devoluciones", icon: "↩️", roles: ["all"], module: null },
        { path: "/admin/seguimiento-pedidos", title: "Seguimiento", icon: "📍", roles: ["all"], module: null },
        { path: "/admin/ordenes", title: "Órdenes de Compra", icon: "📋", roles: ["all"], module: null }
      ]
    },
    gestion: {
      title: "Gestión del Negocio",
      icon: "⚙️",
      items: [
        { path: "/admin/tiendas", title: "Tiendas", icon: "🏪", roles: ["admin"], module: "tiendas" },
        { path: "/admin/productos", title: "Productos", icon: "📦", roles: ["admin"], module: null },
        { path: "/admin/gastos", title: "Gastos", icon: "💸", roles: ["all"], module: null },
        { path: "/admin/caja", title: "Corte de Caja", icon: "💳", roles: ["admin", "vendedor"], module: null }
      ]
    },
    rrhh: {
      title: "Recursos Humanos",
      icon: "👥",
      items: [
        { path: "/admin/usuarios", title: "Usuarios", icon: "👥", roles: ["admin"], module: null },
        { path: "/admin/empleados", title: "Empleados", icon: "👷", roles: ["all"], module: "empleados" },
        { path: "/admin/historial-empleados", title: "Historial Laboral", icon: "📜", roles: ["admin"], module: "empleados" },
        { path: "/admin/vacaciones", title: "Vacaciones", icon: "🏖️", roles: ["admin"], module: "vacaciones" }
      ]
    },
    reportes: {
      title: "Reportes y Análisis",
      icon: "📊",
      items: [
        { path: "/admin/reportes", title: "Reportes", icon: "📊", roles: ["admin"], module: "reportes" }
      ]
    }
  };

  // Filtrar items según el rol del usuario y la licencia
  const filterItemsByRole = (items) => {
    // Primero filtrar por rol
    let filteredItems = items;
    if (!isAdmin()) {
      // Para usuarios que no son admin, mostrar items que incluyen "all" o el rol específico del usuario
      filteredItems = items.filter(item =>
        item.roles.includes("all") || item.roles.includes(currentUser?.role)
      );
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #23334e 0%, #46546b 100%)' }}>
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
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #23334e 0%, #46546b 100%)' }}>
        <div className="text-center p-8 rounded-xl shadow-2xl max-w-md" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="text-6xl mb-4" style={{ color: '#46546b' }}>🔒</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>Error de Autenticación</h2>
          <p className="mb-4" style={{ color: '#697487' }}>{authError}</p>
          <div className="animate-pulse text-sm" style={{ color: '#8c95a4' }}>Redirigiendo al login...</div>
        </div>
      </div>
    );
  }

  // No user data
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(135deg, #23334e 0%, #46546b 100%)' }}>
        <div className="text-center p-8 rounded-xl shadow-2xl max-w-md" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="text-6xl mb-4" style={{ color: '#46546b' }}>⚠️</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>Usuario no encontrado</h2>
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
               backgroundColor: '#23334e', 
               borderRightColor: '#46546b',
               boxShadow: '4px 0 20px rgba(35, 51, 78, 0.15)'
             }}>
        
        {/* Header del sidebar */}
        <div className="p-6 border-b flex-shrink-0" style={{ borderBottomColor: '#46546b' }}>
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <img src={logo} alt="Logo" className="w-12 h-12 rounded-lg shadow-lg bg-white/10 p-2" />
                <div>
                  <h1 className="text-xl font-bold text-white">POS System</h1>
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
          <div className="p-4 border-b flex-shrink-0" style={{ borderBottomColor: '#46546b', backgroundColor: 'rgba(70, 84, 107, 0.3)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg scroll-smooth-transition" 
                   style={{ background: 'linear-gradient(135deg, #f4f6fa 0%, #8c95a4 100%)', color: '#23334e' }}>
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
          <div className="p-4 border-b flex-shrink-0" style={{ borderBottomColor: '#46546b' }}>
            <div className="text-xs space-y-1" style={{ color: '#8c95a4' }}>
              <div className="flex justify-between">
                <span>📅 {date}</span>
              </div>
              <div className="flex justify-between">
                <span>🕐 {time}</span>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NAVEGACIÓN MEJORADA - con scroll corporativo oscuro y efectos */}
        <nav className="flex-1 p-4 overflow-y-auto dark-scroll smooth-scroll scroll-smooth-transition">
          {/* ✅ Indicador de scroll superior */}
          <div className="scroll-indicator h-1 mb-2 rounded-full opacity-50"></div>
          
          {Object.entries(navigationCategories).map(([key, category]) => {
            const filteredItems = filterItemsByRole(category.items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={key} className="mb-6">
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2 scroll-smooth-transition" style={{ color: '#8c95a4' }}>
                    <span className="mr-2">{category.icon}</span>
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
                            background: 'linear-gradient(135deg, #46546b 0%, #697487 100%)', 
                            color: 'white',
                            borderLeftColor: '#f4f6fa',
                            boxShadow: '0 4px 12px rgba(70, 84, 107, 0.3)'
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
                      <span className="text-lg mr-3">{item.icon}</span>
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
        <div className="p-4 border-t flex-shrink-0" style={{ borderTopColor: '#46546b' }}>
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
              <h1 className="text-2xl font-bold scroll-smooth-transition" style={{ color: '#23334e' }}>
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
              </h1>
              <p className="text-sm mt-1" style={{ color: '#697487' }}>
                {date} • {time}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Botón de Control de Turno */}
              <button
                onClick={() => turnoActivo ? setShowCerrarTurnoModal(true) : setShowIniciarTurnoModal(true)}
                className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
                style={turnoActivo
                  ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }
                  : { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white' }
                }
                title={turnoActivo && turnoActivo.usuario?.username ? `Turno abierto por ${turnoActivo.usuario.username}` : ''}
              >
                {turnoActivo ? '🟢 Turno: Abierto' : '🔴 Turno: Cerrado'}
              </button>

              {/* Avatar del usuario */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg scroll-smooth-transition"
                     style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                     onMouseEnter={(e) => {
                       e.target.style.transform = 'scale(1.1)';
                       e.target.style.boxShadow = '0 6px 20px rgba(35, 51, 78, 0.3)';
                     }}
                     onMouseLeave={(e) => {
                       e.target.style.transform = 'scale(1)';
                       e.target.style.boxShadow = '0 4px 6px rgba(35, 51, 78, 0.1)';
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
          onSuccess={() => {
            setShowIniciarTurnoModal(false);
            // Si hay una tienda seleccionada, refrescar con esa tienda
            // Si no, refrescar sin parámetro (busca turno del usuario)
            refetchTurno(tiendaSeleccionadaActual);
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