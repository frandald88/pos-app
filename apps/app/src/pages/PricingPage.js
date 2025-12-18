import { useState } from 'react';
import apiBaseUrl from '../config/api';
import '../styles/PricingPage.css';

const API_URL = apiBaseUrl;
const APP_URL = window.location.origin;

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Información de los planes
  const planInfo = {
    launch: { name: 'Lanzamiento', price: '$1,249 MXN', period: '3 meses', badge: 'Oferta Especial' },
    basic: { name: 'Básico Anual', price: '$5,999 MXN', period: 'año' },
    pro: { name: 'Pro Anual', price: '$8,499 MXN', period: 'año' }
  };

  // Función para manejar suscripción a planes
  const handlePlanClick = (planId) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:ventas@astrodish.com?subject=Plan Enterprise';
      return;
    }

    const token = localStorage.getItem('token');

    if (token) {
      // Usuario autenticado - crear sesión directamente
      handleCreateCheckoutSession(planId, token);
    } else {
      // Usuario NO autenticado - mostrar modal
      setSelectedPlan(planId);
      setShowEmailModal(true);
    }
  };

  // Crear sesión de checkout (usuario autenticado)
  const handleCreateCheckoutSession = async (planId, token) => {
    setLoadingPlan(planId);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: planId,
          successUrl: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${APP_URL}/pricing`
        })
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.message || 'Error al crear sesión de pago');
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
      setLoadingPlan(null);
    }
  };

  // Proceder a checkout con pre-registro
  const handleProceedToCheckout = async (e) => {
    e.preventDefault();
    setLoadingPlan(selectedPlan);

    try {
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlan,
          pendingRegistration: true,
          customerEmail: userEmail,
          customerName: userName,
          companyName: companyName,
          successUrl: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${APP_URL}/pricing`
        })
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.message || 'Error al crear sesión de pago');
        setLoadingPlan(null);
        setShowEmailModal(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Por favor intenta de nuevo.');
      setLoadingPlan(null);
      setShowEmailModal(false);
    }
  };

  return (
    <div className="pricing-page-app">
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <a href="http://localhost:3001" className="logo">
              <img src={`${process.env.PUBLIC_URL}/astrodishlogo1.png`} alt="AstroDish" style={{height: '40px'}} />
            </a>

            {/* Desktop Navigation */}
            <div className="nav-links">
              <a href="http://localhost:3001/#/features">Características</a>
              <a href="http://localhost:3001/#pricing">Precios</a>
              <a href="http://localhost:3001/#contact">Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary">Iniciar Sesión</a>
              <button onClick={() => handlePlanClick('launch')} className="btn-primary">Comenzar</button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span style={{transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none'}}></span>
              <span style={{opacity: mobileMenuOpen ? 0 : 1}}></span>
              <span style={{transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'}}></span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mobile-menu">
              <a href="http://localhost:3001/#/features" onClick={() => setMobileMenuOpen(false)}>Características</a>
              <a href="http://localhost:3001/#pricing" onClick={() => setMobileMenuOpen(false)}>Precios</a>
              <a href="http://localhost:3001/#contact" onClick={() => setMobileMenuOpen(false)}>Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>Iniciar Sesión</a>
              <button onClick={() => { handlePlanClick('launch'); setMobileMenuOpen(false); }} className="btn-primary">Comenzar</button>
            </div>
          )}
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="pricing">
        <div className="container">
          <h2 className="section-title">Planes para cada tipo de negocio</h2>
          <p className="section-subtitle">Invierte en tu negocio y crece con nosotros</p>

          {/* Error Message */}
          {error && (
            <div style={{
              maxWidth: '600px',
              margin: '0 auto 2rem',
              padding: '1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="pricing-grid">
            {/* Plan Lanzamiento */}
            <div className="pricing-card">
              <div className="badge" style={{background: '#22c55e'}}>Oferta de Lanzamiento</div>
              <div className="plan-name">Lanzamiento</div>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">1,249</span>
                <span className="currency" style={{fontSize: '1rem', marginLeft: '0.25rem'}}>MXN</span>
                <span className="period">/3 meses</span>
              </div>
              <ul className="plan-features">
                <li>1 Tienda</li>
                <li>5 Usuarios</li>
                <li>500 Productos</li>
                <li>Delivery incluido</li>
                <li>Reportes completos</li>
                <li>Soporte por email</li>
              </ul>
              <button
                onClick={() => handlePlanClick('launch')}
                className="btn-primary"
                disabled={loadingPlan === 'launch'}
              >
                {loadingPlan === 'launch' ? 'Procesando...' : 'Comenzar Ahora'}
              </button>
            </div>

            {/* Plan Básico Anual */}
            <div className="pricing-card">
              <div className="plan-name">Básico Anual</div>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">5,999</span>
                <span className="currency" style={{fontSize: '1rem', marginLeft: '0.25rem'}}>MXN</span>
                <span className="period">/año</span>
              </div>
              <ul className="plan-features">
                <li>1 Tienda</li>
                <li>5 Usuarios</li>
                <li>500 Productos</li>
                <li>Delivery incluido</li>
                <li>Reportes completos</li>
                <li>Soporte por email</li>
              </ul>
              <button
                onClick={() => handlePlanClick('basic')}
                className="btn-outline"
                disabled={loadingPlan === 'basic'}
              >
                {loadingPlan === 'basic' ? 'Procesando...' : 'Comenzar'}
              </button>
            </div>

            {/* Plan Pro Anual */}
            <div className="pricing-card">
              <div className="plan-name">Pro Anual</div>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">8,499</span>
                <span className="currency" style={{fontSize: '1rem', marginLeft: '0.25rem'}}>MXN</span>
                <span className="period">/año</span>
              </div>
              <ul className="plan-features">
                <li>3 Tiendas</li>
                <li>20 Usuarios</li>
                <li>2,000 Productos</li>
                <li>Multi-tienda</li>
                <li>Reportes avanzados</li>
                <li>Soporte prioritario</li>
              </ul>
              <button
                onClick={() => handlePlanClick('pro')}
                className="btn-outline"
                disabled={loadingPlan === 'pro'}
              >
                {loadingPlan === 'pro' ? 'Procesando...' : 'Comenzar'}
              </button>
            </div>

            {/* Plan Enterprise */}
            <div className="pricing-card">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price">
                <span className="amount">Contactar</span>
              </div>
              <ul className="plan-features">
                <li>Tiendas ilimitadas</li>
                <li>Usuarios ilimitados</li>
                <li>Productos ilimitados</li>
                <li>API personalizada</li>
                <li>Integraciones</li>
                <li>Soporte 24/7</li>
                <li>Capacitación incluida</li>
              </ul>
              <a href="mailto:ventas@astrodish.com" className="btn-outline">Contactar Ventas</a>
            </div>
          </div>
        </div>
      </section>

      {/* Modal para email */}
      {showEmailModal && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Plan seleccionado */}
            <div style={{
              background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              {planInfo[selectedPlan].badge && (
                <div style={{
                  display: 'inline-block',
                  background: '#22c55e',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  {planInfo[selectedPlan].badge}
                </div>
              )}
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Plan {planInfo[selectedPlan].name}
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: '800' }}>
                {planInfo[selectedPlan].price}
                <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.9 }}>
                  /{planInfo[selectedPlan].period}
                </span>
              </div>
            </div>

            <h2 style={{ marginBottom: '0.5rem', color: '#23334e' }}>
              Completa tus datos
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#697487', fontSize: '0.9rem' }}>
              Solo necesitamos algunos datos para proceder con tu suscripción
            </p>
            <form onSubmit={handleProceedToCheckout}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#23334e', fontWeight: '500' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="Tu nombre"
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#23334e', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="tu@email.com"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#23334e', fontWeight: '500' }}>
                  Nombre de tu negocio *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="Mi Negocio S.A."
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setLoadingPlan(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#23334e',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingPlan}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#2b354f',
                    color: 'white',
                    fontWeight: '600',
                    cursor: loadingPlan ? 'wait' : 'pointer',
                    opacity: loadingPlan ? 0.7 : 1
                  }}
                >
                  {loadingPlan ? 'Procesando...' : 'Continuar al pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <img src={`${process.env.PUBLIC_URL}/Astrodish_logo_2.png`} alt="AstroDish" style={{height: '50px', marginBottom: '1rem'}} />
              <p>AstroDish POS - El sistema en la nube que impulsa tu negocio.</p>
            </div>
            <div className="footer-section">
              <h4>Producto</h4>
              <a href="http://localhost:3001/#/features">Características</a>
              <a href="http://localhost:3001/#pricing">Precios</a>
              <a href="http://localhost:3001/#contact">Contacto</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="http://localhost:3001/#/terms">Términos de Servicio</a>
              <a href="http://localhost:3001/#/privacy">Privacidad</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 AstroDish. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
