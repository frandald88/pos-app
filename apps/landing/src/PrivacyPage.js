import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function PrivacyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handlePlanClick = () => {
    setShowEmailModal(true);
  };

  const handleProceedToCheckout = async (e) => {
    e.preventDefault();
    setLoadingPlan('launch');

    try {
      const response = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: 'launch',
          customerEmail: userEmail,
          customerName: userName,
          companyName: companyName,
          successUrl: `${APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.href
        })
      });

      const data = await response.json();

      if (data.success && data.data.url) {
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

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="nav">
        <div className="container">
          <div className="nav-content">
            <div className="logo">
              <a href="/">
                <img src="/astrodishlogo1.png" alt="AstroDish" style={{height: '40px'}} />
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="nav-links">
              <a href="/">Inicio</a>
              <a href="/#/features">Características</a>
              <a href={`${APP_URL}/pricing`}>Precios</a>
              <a href="/#/contact">Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary">Iniciar Sesión</a>
              <button onClick={handlePlanClick} className="btn-primary">Comenzar</button>
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
              <a href="/" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Inicio</a>
              <a href="/#/features" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Características</a>
              <a href={`${APP_URL}/pricing`} onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Precios</a>
              <a href="/#/contact" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Contacto</a>
              <a href={`${APP_URL}/login`} className="btn-secondary" onClick={() => setMobileMenuOpen(false)} style={{marginTop: '0.5rem'}}>Iniciar Sesión</a>
              <button onClick={() => { handlePlanClick(); setMobileMenuOpen(false); }} className="btn-primary">Comenzar</button>
            </div>
          )}
        </div>
      </nav>

      {/* Privacy Content */}
      <section className="legal-content">
        <div className="container">
          <h1>Política de Privacidad</h1>

          <p className="intro">
            AstroDish respeta tu privacidad. Tu información solo será utilizada para contactarte
            respecto a nuestros servicios. No compartimos tus datos.
          </p>

          <p className="effective-date">
            <strong>Fecha de vigencia:</strong> 15 de mayo de 2025
          </p>

          <p>
            AstroDish está comprometida con la protección de tu privacidad. Esta Política de
            Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información
            personal cuando interactúas con nuestro sitio web y servicios.
          </p>

          <h2>1. Información que Recopilamos</h2>
          <p>A través de nuestros formularios en línea y servicios, podemos recopilar los siguientes datos personales:</p>
          <ul>
            <li>Nombre y Apellido</li>
            <li>Dirección de Correo Electrónico</li>
            <li>Número de Teléfono</li>
            <li>Nombre del Negocio</li>
            <li>Información de Facturación</li>
          </ul>
          <p>Recopilamos estos datos únicamente para propósitos relacionados con el negocio y con tu consentimiento explícito.</p>

          <h2>2. Cómo Usamos tu Información</h2>
          <p>Usamos la información que recopilamos para:</p>
          <ul>
            <li>Proporcionar y mantener nuestros servicios de punto de venta</li>
            <li>Contactarte respecto a tu cuenta o suscripción</li>
            <li>Procesar pagos y facturación</li>
            <li>Mejorar nuestros servicios y experiencia de usuario</li>
            <li>Enviar actualizaciones importantes sobre el servicio</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>
          <p><strong>No vendemos, rentamos ni intercambiamos tus datos personales con terceros.</strong></p>

          <h2>3. Almacenamiento y Seguridad de Datos</h2>
          <p>
            Tus datos personales se almacenan de forma segura en servidores protegidos y/o servicios
            de terceros de confianza. Tomamos medidas organizacionales y técnicas razonables para
            proteger tu información contra acceso no autorizado, divulgación o destrucción.
          </p>

          <h2>4. Compartir con Terceros</h2>
          <p>Podemos compartir tus datos únicamente con:</p>
          <ul>
            <li>Miembros internos del equipo que son parte del proceso de soporte</li>
            <li>Procesadores de pago para completar transacciones</li>
            <li>Plataformas de terceros de confianza utilizadas para operaciones</li>
          </ul>
          <p>Todos los terceros están obligados a mantener la confidencialidad y seguridad de tus datos.</p>

          <h2>5. Tus Derechos</h2>
          <p>
            De acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares (LFPDPPP) de México, puedes:
          </p>
          <ul>
            <li>Acceder a tus datos</li>
            <li>Rectificar inexactitudes</li>
            <li>Cancelar o eliminar tus datos</li>
            <li>Oponerte al uso de tus datos (derechos ARCO)</li>
          </ul>
          <p>Para ejercer tus derechos, por favor contáctanos en:</p>
          <p><a href="mailto:soporte@astrodish.com">soporte@astrodish.com</a></p>

          <h2>6. Consentimiento y Actualizaciones</h2>
          <p>
            Al enviar tus datos a través de nuestros formularios, otorgas consentimiento explícito
            para que usemos tu información personal como se describe anteriormente.
          </p>
          <p>
            Podemos actualizar esta Política de Privacidad de vez en cuando. Cualquier cambio será
            publicado en esta página con una fecha de vigencia actualizada.
          </p>

          <h2>7. Contáctanos</h2>
          <p>
            Si tienes preguntas o inquietudes sobre esta política o tus datos personales, por favor contacta:
          </p>
          <p><a href="mailto:soporte@astrometrika.net">soporte@astrometrika.net</a></p>
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
              <a href={`${APP_URL}/pricing`}>Precios</a>
              <a href="/#/contact">Contacto</a>
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

      {/* Modal para email */}
      {showEmailModal && (
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
            <div style={{
              background: 'linear-gradient(135deg, #2b354f 0%, #5e85e0 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
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
                Oferta Especial
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Plan Lanzamiento
              </h3>
              <div style={{ fontSize: '2rem', fontWeight: '800' }}>
                $1,249 MXN
                <span style={{ fontSize: '1rem', fontWeight: '400', opacity: 0.9 }}>
                  /3 meses
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
    </div>
  );
}

export default PrivacyPage;
