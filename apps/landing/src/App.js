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
