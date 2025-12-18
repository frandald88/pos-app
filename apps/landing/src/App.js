import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

// URL del API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Información de los planes
  const planInfo = {
    launch: { name: 'Lanzamiento', price: '$1,249 MXN', period: '3 meses', badge: 'Oferta Especial' },
    basic: { name: 'Básico Anual', price: '$5,999 MXN', period: 'año' },
    pro: { name: 'Pro Anual', price: '$8,499 MXN', period: 'año' }
  };

  // Función para navegar a secciones (solo para secciones en la página principal, no rutas)
  const handleNavigateToSection = (sectionId) => {
    // Si estamos en la raíz, solo hacer scroll
    if (window.location.hash === '' || window.location.hash === '#') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Si estamos en otra ruta (ej: /#/features), ir a raíz primero
      window.location.hash = '';
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Función para manejar suscripción a planes
  const handlePlanClick = (planId) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:ventas@tuapp.com?subject=Plan Enterprise';
      return;
    }

    // Mostrar modal para recopilar email antes de ir a Stripe
    setSelectedPlan(planId);
    setShowEmailModal(true);
  };

  // Función para proceder a Stripe Checkout
  const handleProceedToCheckout = async (e) => {
    e.preventDefault();
    setLoadingPlan(selectedPlan);

    try {
      // Llamar a la API para crear sesión de Stripe Checkout
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: selectedPlan,
          customerEmail: userEmail,
          customerName: userName,
          companyName: companyName,
          successUrl: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.data.url;
      } else {
        alert(data.message || 'Error al crear sesión de pago');
        setLoadingPlan(null);
      }
    } catch (err) {
      console.error('Error al crear checkout:', err);
      alert('Error de conexión. Por favor intenta de nuevo.');
      setLoadingPlan(null);
    }
  };

  const handleContactChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (data.success) {
        setContactStatus({ type: 'success', message: data.message });
        setContactForm({ name: '', email: '', phone: '', company: '', message: '' });
      } else {
        setContactStatus({ type: 'error', message: data.message || 'Error al enviar mensaje' });
      }
    } catch (error) {
      setContactStatus({ type: 'error', message: 'Error de conexión. Intenta más tarde.' });
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <a href="/" className="logo">
              <img src="/astrodishlogo1.png" alt="AstroDish" style={{height: '40px'}} />
            </a>

            {/* Desktop Navigation */}
            <div className="nav-links">
              <a href="/#/features">Características</a>
              <a href="/#pricing" onClick={(e) => { e.preventDefault(); handleNavigateToSection('pricing'); }}>Precios</a>
              <a href="/#contact" onClick={(e) => { e.preventDefault(); handleNavigateToSection('contact'); }}>Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary">Iniciar Sesión</a>
              <button onClick={() => handlePlanClick('launch')} className="btn-primary">Comenzar</button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{display: 'none'}}
              aria-label="Toggle menu"
            >
              <span style={{transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none'}}></span>
              <span style={{opacity: mobileMenuOpen ? 0 : 1}}></span>
              <span style={{transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none'}}></span>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem 0',
              borderTop: '1px solid var(--gray-200)',
              marginTop: '1rem'
            }}>
              <a href="/#/features" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Características</a>
              <a href="/#pricing" onClick={(e) => { e.preventDefault(); handleNavigateToSection('pricing'); setMobileMenuOpen(false); }} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Precios</a>
              <a href="/#contact" onClick={(e) => { e.preventDefault(); handleNavigateToSection('contact'); setMobileMenuOpen(false); }} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary" onClick={() => setMobileMenuOpen(false)} style={{marginTop: '0.5rem'}}>Iniciar Sesión</a>
              <button onClick={() => { handlePlanClick('launch'); setMobileMenuOpen(false); }} className="btn-primary">Comenzar</button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <img src="/Astrodish_logo_2.png" alt="AstroDish POS" className="hero-logo" />
            <h1>El Sistema POS que impulsa tu negocio</h1>
            <p className="hero-subtitle">
              Gestiona ventas, inventario y reportes desde la nube con AstroDish POS.
              Sin instalación, sin complicaciones.
            </p>
            <div className="hero-buttons">
              <button onClick={() => handlePlanClick('launch')} className="btn-primary btn-large">
                Comenzar por $1,249 MXN
              </button>
              <a href="#pricing" onClick={(e) => { e.preventDefault(); handleNavigateToSection('pricing'); }} className="btn-secondary btn-large">
                Ver Planes
              </a>
            </div>
            <p className="hero-note">3 meses de acceso completo</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Todo lo que necesitas para vender más</h2>
          <div className="features-grid">
            {/* 1. Reportes */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </svg>
              </div>
              <h3>Reportes en Tiempo Real</h3>
              <p>Visualiza tus ventas, gastos y ganancias al instante con dashboards intuitivos y análisis detallados.</p>
            </div>

            {/* 2. Punto de Venta Intuitivo */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3>Punto de Venta Intuitivo</h3>
              <p>Interfaz moderna y rápida diseñada para agilizar cada transacción con múltiples métodos de pago.</p>
            </div>

            {/* 3. Gestión de Mesas, Cuentas y Comandas */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h3>Gestión de Restaurante</h3>
              <p>Administra mesas, divide cuentas y envía comandas a cocina. Control total de tu operación.</p>
            </div>

            {/* 4. Gestión Multi-tienda */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <path d="M9 22V12h6v10" />
                </svg>
              </div>
              <h3>Operación Multi-tienda</h3>
              <p>Administra múltiples sucursales desde un solo lugar con reportes consolidados.</p>
            </div>

            {/* 5. Seguimiento de Entregas */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3>Seguimiento de Entregas</h3>
              <p>Asigna repartidores, monitorea estados y optimiza tus rutas de entrega en tiempo real.</p>
            </div>

            {/* 6. Corte de Caja Automático */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
              </div>
              <h3>Corte de Caja Automático</h3>
              <p>Cierra tu día en segundos. Concilia ventas, pagos y efectivo con precisión absoluta.</p>
            </div>

            {/* 7. Gestión de Personal */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Administración de Personal</h3>
              <p>Controla asistencia, horarios, vacaciones y nómina. Gestión completa de tu equipo.</p>
            </div>

            {/* 8. Gestión de Compras */}
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3>Control de Inventario y Compras</h3>
              <p>Gestiona productos, stock, proveedores y órdenes de compra. Alertas automáticas de inventario bajo.</p>
            </div>
          </div>

          {/* CTA Button - Solicitar Demo */}
          <div style={{textAlign: 'center', marginTop: '3rem'}}>
            <a href="#contact" onClick={(e) => { e.preventDefault(); handleNavigateToSection('contact'); }} className="btn-primary btn-large">
              Solicitar Demo
            </a>
            <p style={{marginTop: '1rem', color: 'var(--gray-500)', fontSize: '0.95rem'}}>
              Descubre todas las características en detalle →{' '}
              <a href="/#/features" style={{color: 'var(--primary)', fontWeight: '600', textDecoration: 'underline'}}>
                Ver características completas
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="trust-badges">
        <div className="container">
          <div className="trust-badges-grid">
            {/* SSL Badge */}
            <div className="trust-badge">
              <div className="trust-badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div className="trust-badge-text">
                <strong>Conexión Segura</strong>
                <span>Encriptación SSL 256-bit</span>
              </div>
            </div>

            {/* Hecho en México */}
            <div className="trust-badge">
              <div className="trust-badge-icon">
                <span style={{fontSize: '2rem'}}>🇲🇽</span>
              </div>
              <div className="trust-badge-text">
                <strong>Hecho en México</strong>
                <span>Soporte local en español</span>
              </div>
            </div>

            {/* Stripe Badge - CENTRO */}
            <div className="trust-badge">
              <div className="trust-badge-icon">
                <svg viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" fill="#635BFF"/>
                </svg>
              </div>
              <div className="trust-badge-text">
                <strong>Pagos Seguros</strong>
                <span>Stripe • Visa • Mastercard • Amex</span>
              </div>
            </div>

            {/* Cumplimiento LFPDPPP */}
            <div className="trust-badge">
              <div className="trust-badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="trust-badge-text">
                <strong>Privacidad Protegida</strong>
                <span>Cumplimiento LFPDPPP</span>
              </div>
            </div>

            {/* Soporte */}
            <div className="trust-badge">
              <div className="trust-badge-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
                </svg>
              </div>
              <div className="trust-badge-text">
                <strong>Soporte Dedicado</strong>
                <span>Lun-Sáb 9am-7pm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="screenshots">
        <div className="container">
          <h2 className="section-title">El sistema en acción</h2>
          <p className="section-subtitle">Mira lo fácil que es gestionar tu negocio con AstroDish</p>

          <div className="screenshots-grid">
            {/* Screenshot 1 - Punto de Venta */}
            <div className="screenshot-item">
              <div className="screenshot-image">
                <img src="/screenshots/pos.png" alt="Punto de Venta AstroDish" loading="lazy" />
              </div>
              <div className="screenshot-info">
                <h3>Punto de Venta Intuitivo</h3>
                <p>Interfaz rápida y fácil de usar. Vende en segundos, no en minutos.</p>
              </div>
            </div>

            {/* Screenshot 2 - Reportes */}
            <div className="screenshot-item">
              <div className="screenshot-image">
                <img src="/screenshots/reportes.png" alt="Dashboard y Reportes" loading="lazy" />
              </div>
              <div className="screenshot-info">
                <h3>Reportes en Tiempo Real</h3>
                <p>Visualiza tus ventas, productos más vendidos y métricas clave al instante.</p>
              </div>
            </div>

            {/* Screenshot 3 - Restaurant */}
            <div className="screenshot-item">
              <div className="screenshot-image">
                <img src="/screenshots/restaurant.png" alt="Modo Restaurant" loading="lazy" />
              </div>
              <div className="screenshot-info">
                <h3>Modo Restaurant Completo</h3>
                <p>Gestiona mesas, comandas y cuentas con total control.</p>
              </div>
            </div>

            {/* Screenshot 4 - Productos */}
            <div className="screenshot-item">
              <div className="screenshot-image">
                <img src="/screenshots/productos.png" alt="Gestión de Productos" loading="lazy" />
              </div>
              <div className="screenshot-info">
                <h3>Control de Inventario</h3>
                <p>Administra tu catálogo, stock y proveedores sin complicaciones.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="container">
          <h2 className="section-title">Planes para cada tipo de negocio</h2>
          <p className="section-subtitle">Invierte en tu negocio y crece con nosotros</p>

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
                <li>✓ 1 Tienda</li>
                <li>✓ 5 Usuarios</li>
                <li>✓ 500 Productos</li>
                <li>✓ Delivery incluido</li>
                <li>✓ Reportes completos</li>
                <li>✓ Soporte por email</li>
              </ul>
              <button onClick={() => handlePlanClick('launch')} className="btn-primary">Comenzar Ahora</button>
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
                <li>✓ 1 Tienda</li>
                <li>✓ 5 Usuarios</li>
                <li>✓ 500 Productos</li>
                <li>✓ Delivery incluido</li>
                <li>✓ Reportes completos</li>
                <li>✓ Soporte por email</li>
              </ul>
              <button onClick={() => handlePlanClick('basic')} className="btn-outline">Comenzar</button>
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
                <li>✓ 3 Tiendas</li>
                <li>✓ 20 Usuarios</li>
                <li>✓ 2,000 Productos</li>
                <li>✓ Multi-tienda</li>
                <li>✓ Reportes avanzados</li>
                <li>✓ Soporte prioritario</li>
              </ul>
              <button onClick={() => handlePlanClick('pro')} className="btn-outline">Comenzar</button>
            </div>

            {/* Plan Enterprise */}
            <div className="pricing-card">
              <div className="plan-name">Enterprise</div>
              <div className="plan-price">
                <span className="amount">Contactar</span>
              </div>
              <ul className="plan-features">
                <li>✓ Tiendas ilimitadas</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ Productos ilimitados</li>
                <li>✓ API personalizada</li>
                <li>✓ Integraciones</li>
                <li>✓ Soporte 24/7</li>
                <li>✓ Capacitación incluida</li>
              </ul>
              <a href="mailto:ventas@tupos.com" className="btn-outline">Contactar Ventas</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <h2 className="section-title">Contáctanos</h2>
          <p className="section-subtitle">
            ¿Tienes preguntas? Estamos aquí para ayudarte
          </p>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-item">
                <div className="contact-icon">📧</div>
                <div>
                  <h4>Email</h4>
                  <a href="mailto:soporte@astrodish.com">soporte@astrodish.com</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div>
                  <h4>Teléfono</h4>
                  <a href="tel:+525512345678">+52 55 1234 5678</a>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">📍</div>
                <div>
                  <h4>Ubicación</h4>
                  <p>Ciudad de México, México</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon">⏰</div>
                <div>
                  <h4>Horario</h4>
                  <p>Lun - Vie: 9:00 - 18:00</p>
                </div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleContactSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Nombre *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    required
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    required
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactChange}
                    placeholder="+52 55 1234 5678"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="company">Empresa</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={contactForm.company}
                    onChange={handleContactChange}
                    placeholder="Nombre de tu empresa"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="message">Mensaje *</label>
                <textarea
                  id="message"
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                  rows="4"
                  placeholder="¿En qué podemos ayudarte?"
                ></textarea>
              </div>

              {contactStatus.message && (
                <div className={`form-status ${contactStatus.type}`}>
                  {contactStatus.message}
                </div>
              )}

              <button type="submit" className="btn-primary btn-large" disabled={contactLoading}>
                {contactLoading ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
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
                    backgroundColor: '#3b82f6',
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

      {/* FAQ Section - Preview */}
      <section className="faq">
        <div className="container">
          <h2 className="section-title">Preguntas Frecuentes</h2>
          <p className="section-subtitle">Resolvemos tus dudas sobre AstroDish</p>

          <div className="faq-grid-preview">
            {/* Pregunta 1 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Qué es AstroDish y cómo funciona?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>AstroDish es un sistema de punto de venta (POS) en la nube diseñado para negocios mexicanos. Funciona en cualquier dispositivo con internet: computadoras, tablets o teléfonos. Registra tus ventas, controla tu inventario y genera reportes en tiempo real, todo desde un solo lugar.</p>
              </div>
            </details>

            {/* Pregunta 2 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Necesito instalar algo o comprar equipo especial?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>No. AstroDish funciona 100% en la nube desde tu navegador web. Solo necesitas un dispositivo con internet (puede ser tu computadora, tablet o teléfono actual). Si quieres, puedes conectar impresoras de tickets o lectores de código de barras, pero no son obligatorios.</p>
              </div>
            </details>

            {/* Pregunta 3 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Hay comisiones por venta o costos ocultos?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>No. El precio que ves es el precio que pagas. No cobramos comisiones por venta ni porcentajes de tus ingresos. Tampoco hay costos de instalación o configuración. Es una suscripción mensual/anual fija.</p>
              </div>
            </details>

            {/* Pregunta 4 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Funciona para restaurantes con mesas y comandas?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí. AstroDish incluye un modo especial para restaurantes con:</p>
                <ul style={{marginTop: '0.5rem', marginLeft: '1.5rem', listStyle: 'disc'}}>
                  <li>Gestión de mesas y su ocupación</li>
                  <li>Comandas que se envían directo a cocina</li>
                  <li>División de cuenta entre comensales</li>
                  <li>Control de propinas</li>
                </ul>
              </div>
            </details>
          </div>

          {/* CTA para ver más preguntas */}
          <div style={{textAlign: 'center', marginTop: '3rem'}}>
            <p style={{fontSize: '1.1rem', color: 'var(--gray-600)', marginBottom: '1.5rem'}}>
              ¿Tienes más preguntas?
            </p>
            <a href="/#/faq" className="btn-outline btn-large">
              Ver todas las preguntas frecuentes
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <img src="/Astrodish_logo_2.png" alt="AstroDish" style={{height: '50px', marginBottom: '1rem'}} />
              <p>AstroDish POS - El sistema en la nube que impulsa tu negocio.</p>
            </div>
            <div className="footer-section">
              <h4>Producto</h4>
              <a href="/#/features">Características</a>
              <a href="/#pricing" onClick={(e) => { e.preventDefault(); handleNavigateToSection('pricing'); }}>Precios</a>
              <a href="/#contact" onClick={(e) => { e.preventDefault(); handleNavigateToSection('contact'); }}>Contacto</a>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <a href="/#/terms">Términos de Servicio</a>
              <a href="/#/privacy">Privacidad</a>
              <a href="/#/faq">Preguntas Frecuentes</a>
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

export default App;
