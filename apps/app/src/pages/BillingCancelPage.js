import { useNavigate } from "react-router-dom";

export default function BillingCancelPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Cancel Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold mb-4" style={{ color: '#23334e' }}>
          Pago Cancelado
        </h1>

        <p className="text-lg mb-8" style={{ color: '#697487' }}>
          No se realizó ningún cargo. Puedes volver a intentarlo cuando estés listo.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/admin/pricing')}
            className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
          >
            Ver Planes Nuevamente
          </button>

          <button
            onClick={() => navigate('/admin/ventas')}
            className="w-full py-3 px-6 rounded-lg font-semibold border-2 transition-all duration-200"
            style={{ color: '#23334e', borderColor: '#23334e' }}
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
