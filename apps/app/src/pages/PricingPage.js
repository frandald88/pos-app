import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'launch',
      name: '🚀 Lanzamiento',
      price: '$1,249',
      period: '3 meses',
      description: 'Oferta especial de lanzamiento',
      features: [
        '5 usuarios',
        '1 tienda',
        'Hasta 500 productos',
        'Todos los módulos incluidos',
        'Delivery y Reportes',
        'Soporte por email',
        '⏰ Oferta por tiempo limitado'
      ],
      cta: 'Comenzar Ahora',
      color: 'blue',
      popular: true,
      onClick: () => navigate('/register?plan=launch')
    },
    {
      id: 'basic',
      name: 'Basic Anual',
      price: '$5,999',
      period: '/año',
      description: 'Para negocios pequeños',
      features: [
        '5 usuarios',
        '1 tienda',
        'Hasta 500 productos',
        'Todos los módulos incluidos',
        'Delivery y Reportes',
        'Soporte por email'
      ],
      cta: 'Seleccionar Plan',
      color: 'gray',
      popular: false,
      onClick: () => navigate('/register?plan=basic')
    },
    {
      id: 'pro',
      name: 'Pro Anual',
      price: '$8,499',
      period: '/año',
      description: 'Para negocios en crecimiento',
      features: [
        '20 usuarios',
        '3 tiendas',
        'Hasta 2,000 productos',
        'Todos los módulos',
        'Multi-tienda incluido',
        'Soporte prioritario'
      ],
      cta: 'Seleccionar Plan',
      color: 'green',
      popular: false,
      onClick: () => navigate('/register?plan=pro')
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Contactar',
      period: '',
      description: 'Para grandes operaciones',
      features: [
        'Usuarios ilimitados',
        'Tiendas ilimitadas',
        'Productos ilimitados',
        'Todos los módulos',
        'Multi-tienda avanzado',
        'Soporte dedicado 24/7',
        'SLA personalizado',
        'Integraciones custom',
        'Planes lifetime disponibles'
      ],
      cta: 'Contactar Ventas',
      color: 'dark',
      popular: false,
      onClick: () => window.location.href = 'mailto:ventas@tuapp.com?subject=Plan Enterprise'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-600',
          button: 'bg-green-600 hover:bg-green-700'
        };
      case 'dark':
        return {
          bg: 'bg-gray-900',
          border: 'border-gray-700',
          text: 'text-white',
          button: 'bg-gray-700 hover:bg-gray-800'
        };
      case 'gray':
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold" style={{ color: '#23334e' }}>
              Planes y Precios
            </h1>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all"
              style={{ color: '#23334e', borderColor: '#23334e' }}
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Intro */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#23334e' }}>
            Elige el plan perfecto para tu negocio
          </h2>
          <p className="text-xl" style={{ color: '#697487' }}>
            Todos los planes incluyen acceso completo a todas las funcionalidades
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const colors = getColorClasses(plan.color);

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl shadow-xl p-8 transition-all duration-300 ${
                  plan.popular ? 'transform scale-105 ring-4 ring-blue-400' : ''
                } ${!plan.disabled ? 'hover:shadow-2xl hover:-translate-y-1' : ''}`}
                style={{ backgroundColor: 'white' }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      🔥 OFERTA ESPECIAL
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: '#697487' }}>
                    {plan.description}
                  </p>

                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold" style={{ color: '#23334e' }}>
                      {plan.price}
                    </span>
                    <span className="ml-2 text-sm" style={{ color: '#697487' }}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: '#22c55e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm" style={{ color: '#697487' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={plan.disabled ? undefined : plan.onClick}
                  disabled={plan.disabled}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${colors.button}`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8" style={{ color: '#23334e' }}>
            Preguntas Frecuentes
          </h3>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-bold mb-2" style={{ color: '#23334e' }}>
                ¿Qué es la oferta de Lanzamiento?
              </h4>
              <p style={{ color: '#697487' }}>
                La oferta de Lanzamiento te da 3 meses de acceso completo por solo $1,249 MXN (~$416/mes).
                Es ideal para probar el sistema y ver resultados reales en tu negocio antes de comprometerte a un plan anual.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-bold mb-2" style={{ color: '#23334e' }}>
                ¿Cuál es la diferencia entre Basic y Pro?
              </h4>
              <p style={{ color: '#697487' }}>
                Basic es ideal para negocios pequeños (5 usuarios, 1 tienda, 500 productos).
                Pro está diseñado para negocios en crecimiento (20 usuarios, 3 tiendas, 2000 productos) e incluye multi-tienda.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-bold mb-2" style={{ color: '#23334e' }}>
                ¿Qué incluye el plan Enterprise?
              </h4>
              <p style={{ color: '#697487' }}>
                El plan Enterprise está diseñado para grandes operaciones con necesidades personalizadas.
                Incluye usuarios y tiendas ilimitados, soporte dedicado 24/7, SLA personalizado,
                integraciones custom y opciones de planes lifetime. Contacta a ventas para más información.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h4 className="font-bold mb-2" style={{ color: '#23334e' }}>
                ¿Hay soporte incluido?
              </h4>
              <p style={{ color: '#697487' }}>
                Sí, todos los planes incluyen soporte. Los planes Pro y Enterprise tienen soporte prioritario
                con tiempos de respuesta más rápidos.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              ¿Listo para transformar tu negocio?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Comienza hoy con nuestra oferta especial de lanzamiento
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register?plan=launch')}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Comenzar con Lanzamiento - $1,249
              </button>
              <button
                onClick={() => window.location.href = 'mailto:ventas@tuapp.com?subject=Plan Enterprise'}
                className="bg-blue-900 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-950 transition-all transform hover:scale-105 border-2 border-white"
              >
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
