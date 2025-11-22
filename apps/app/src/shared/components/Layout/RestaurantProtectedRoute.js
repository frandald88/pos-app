import { Navigate } from 'react-router-dom';

/**
 * Componente para proteger rutas que solo deben estar disponibles para negocios tipo restaurant
 */
export default function RestaurantProtectedRoute({ children }) {
  // Obtener configuración del tenant desde localStorage
  const tenantConfigStr = localStorage.getItem('tenantConfig');

  if (!tenantConfigStr) {
    // Si no hay configuración, redirigir a ventas
    return <Navigate to="/admin/ventas" replace />;
  }

  try {
    const tenantConfig = JSON.parse(tenantConfigStr);
    const isRestaurant = tenantConfig.isRestaurant || false;

    if (!isRestaurant) {
      // Si no es restaurant, redirigir a ventas
      console.warn('⚠️ Intento de acceso a ruta de restaurant sin ser tipo restaurant');
      return <Navigate to="/admin/ventas" replace />;
    }

    // Si es restaurant, renderizar el componente hijo
    return children;
  } catch (error) {
    console.error('Error al verificar tipo de negocio:', error);
    return <Navigate to="/admin/ventas" replace />;
  }
}
