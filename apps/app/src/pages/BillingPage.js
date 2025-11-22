import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../config/api";

export default function BillingPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiBaseUrl}/api/payments/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSubscription(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar tu suscripción? Se cancelará al final del periodo actual.')) {
      return;
    }

    setCancelingSubscription(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiBaseUrl}/api/payments/cancel-subscription`,
        { immediately: false },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert('Suscripción cancelada. Se cancelará al final del periodo actual.');
      fetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Error al cancelar la suscripción. Por favor, intenta de nuevo.');
    } finally {
      setCancelingSubscription(false);
    }
  };

  const getPlanName = (planId) => {
    const plans = {
      trial: 'Trial',
      basic: 'Plan Básico',
      pro: 'Plan Pro',
      enterprise: 'Plan Enterprise'
    };
    return plans[planId] || planId;
  };

  const getStatusBadge = (status) => {
    const statuses = {
      active: { bg: '#10b981', text: 'Activa' },
      trialing: { bg: '#3b82f6', text: 'Trial' },
      past_due: { bg: '#f59e0b', text: 'Pago Pendiente' },
      canceled: { bg: '#ef4444', text: 'Cancelada' },
      suspended: { bg: '#6b7280', text: 'Suspendida' }
    };

    const statusInfo = statuses[status] || { bg: '#6b7280', text: status };

    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: statusInfo.bg }}
      >
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: '#46546b' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p style={{ color: '#697487' }}>Cargando información de facturación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
            Facturación y Suscripción
          </h1>
          <p style={{ color: '#697487' }}>
            Gestiona tu plan y facturación
          </p>
        </div>

        {/* Current Subscription Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                {getPlanName(subscription?.plan)}
              </h2>
              <div className="flex items-center space-x-3">
                {getStatusBadge(subscription?.status)}
                {subscription?.cancelAtPeriodEnd && (
                  <span className="text-sm" style={{ color: '#f59e0b' }}>
                    • Cancela el {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX')}
                  </span>
                )}
              </div>
            </div>

            {subscription?.status !== 'canceled' && !subscription?.isTrialing && (
              <button
                onClick={() => navigate('/admin/pricing')}
                className="mt-4 md:mt-0 py-2 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
              >
                Cambiar Plan
              </button>
            )}
          </div>

          {/* Trial Info */}
          {subscription?.isTrialing && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: '#1e40af' }}>
                  <strong>Trial activo:</strong> Expira el {new Date(subscription.trialEndsAt).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          )}

          {/* Subscription Details */}
          {!subscription?.isTrialing && subscription?.currentPeriodEnd && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#8c95a4' }}>
                  Periodo Actual
                </p>
                <p style={{ color: '#23334e' }}>
                  {new Date(subscription.currentPeriodStart).toLocaleDateString('es-MX')} - {new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX')}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#8c95a4' }}>
                  Próximo Pago
                </p>
                <p style={{ color: '#23334e' }}>
                  {subscription.cancelAtPeriodEnd ? 'N/A (Cancelando)' : new Date(subscription.currentPeriodEnd).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          )}

          {/* Usage Stats */}
          <div className="border-t pt-6" style={{ borderColor: '#e5e7eb' }}>
            <h3 className="font-semibold mb-4" style={{ color: '#23334e' }}>
              Uso de Recursos
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Users */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#8c95a4' }}>
                  Usuarios
                </p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {subscription?.usage?.users}
                </p>
              </div>

              {/* Tiendas */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#8c95a4' }}>
                  Tiendas
                </p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {subscription?.usage?.tiendas}
                </p>
              </div>

              {/* Products */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#8c95a4' }}>
                  Productos
                </p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {subscription?.usage?.products}
                </p>
              </div>
            </div>
          </div>

          {/* Cancel Subscription */}
          {subscription?.status === 'active' && !subscription?.cancelAtPeriodEnd && (
            <div className="border-t mt-6 pt-6" style={{ borderColor: '#e5e7eb' }}>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelingSubscription}
                className="text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                style={{ color: '#ef4444' }}
                onMouseEnter={(e) => e.target.style.color = '#dc2626'}
                onMouseLeave={(e) => e.target.style.color = '#ef4444'}
              >
                {cancelingSubscription ? 'Cancelando...' : 'Cancelar Suscripción'}
              </button>
            </div>
          )}
        </div>

        {/* Features Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#23334e' }}>
            Funcionalidades de tu Plan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${subscription?.limits?.canUseDelivery ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subscription?.limits?.canUseDelivery ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
              <span style={{ color: '#697487' }}>Módulo de Delivery</span>
            </div>

            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${subscription?.limits?.canUseReports ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subscription?.limits?.canUseReports ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
              <span style={{ color: '#697487' }}>Reportes Avanzados</span>
            </div>

            <div className="flex items-center">
              <svg className={`w-5 h-5 mr-2 ${subscription?.limits?.canUseMultiTienda ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={subscription?.limits?.canUseMultiTienda ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
              </svg>
              <span style={{ color: '#697487' }}>Multi-Tienda</span>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/admin/ventas')}
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: '#46546b' }}
            onMouseEnter={(e) => e.target.style.color = '#23334e'}
            onMouseLeave={(e) => e.target.style.color = '#46546b'}
          >
            ← Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
