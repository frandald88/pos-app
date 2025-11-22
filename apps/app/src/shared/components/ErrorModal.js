import { useEffect } from 'react';

export default function ErrorModal({ message, onClose, autoCloseSeconds = 10 }) {
  useEffect(() => {
    if (autoCloseSeconds > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoCloseSeconds, onClose]);

  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(35, 51, 78, 0.8)' }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all"
        style={{ animation: 'fadeInScale 0.3s ease-out' }}
      >
        {/* Header con icono de error */}
        <div className="flex items-center justify-center mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#fee2e2' }}
          >
            <span className="text-4xl">❌</span>
          </div>
        </div>

        {/* Título */}
        <h2
          className="text-2xl font-bold text-center mb-4"
          style={{ color: '#23334e' }}
        >
          Error
        </h2>

        {/* Mensaje de error */}
        <div
          className="p-4 rounded-lg border-l-4 mb-6"
          style={{
            borderColor: '#ef4444',
            backgroundColor: '#fef2f2'
          }}
        >
          <p
            className="text-base font-medium text-center"
            style={{ color: '#991b1b' }}
          >
            {message}
          </p>
        </div>

        {/* Contador de auto-cierre */}
        {autoCloseSeconds > 0 && (
          <p
            className="text-sm text-center mb-4"
            style={{ color: '#697487' }}
          >
            Este mensaje se cerrará automáticamente en {autoCloseSeconds} segundos
          </p>
        )}

        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="w-full px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-md active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          }}
        >
          Cerrar
        </button>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
