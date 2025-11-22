import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirigir después de 3 segundos
    const timer = setTimeout(() => {
      navigate('/admin/billing');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold mb-4" style={{ color: '#23334e' }}>
          ¡Pago Exitoso!
        </h1>

        <p className="text-lg mb-6" style={{ color: '#697487' }}>
          Tu suscripción ha sido activada correctamente.
        </p>

        <p className="text-sm mb-8" style={{ color: '#8c95a4' }}>
          Redirigiendo a tu panel de facturación en 3 segundos...
        </p>

        {/* CTA Button */}
        <button
          onClick={() => navigate('/admin/billing')}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
        >
          Ir a Facturación
        </button>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <p className="text-xs mt-4" style={{ color: '#c7d2fe' }}>
            Session ID: {sessionId}
          </p>
        )}
      </div>
    </div>
  );
}
