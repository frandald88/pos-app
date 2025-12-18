import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function FAQPage() {
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

      {/* FAQ Content */}
      <section className="legal-content">
        <div className="container">
          <h1>Preguntas Frecuentes</h1>
          <p className="intro">
            Todo lo que necesitas saber sobre AstroDish POS. Si tienes alguna otra pregunta, no dudes en contactarnos.
          </p>

          <div className="faq-grid">
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
                ¿Cuánto tarda en empezar a usar el sistema?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Puedes empezar en menos de 10 minutos. Una vez que te suscribes, activas tu cuenta, cargas tus productos y ¡listo! Ya puedes hacer tu primera venta. Incluimos videos de capacitación y soporte por WhatsApp para ayudarte en todo momento.</p>
              </div>
            </details>

            {/* Pregunta 4 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Hay comisiones por venta o costos ocultos?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>No. El precio que ves es el precio que pagas. No cobramos comisiones por venta ni porcentajes de tus ingresos. Tampoco hay costos de instalación o configuración. Es una suscripción mensual/anual fija.</p>
              </div>
            </details>

            {/* Pregunta 5 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Puedo cambiar de plan después?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí, puedes cambiar de plan en cualquier momento desde tu panel de administración. Si actualizas a un plan superior, el cambio es inmediato. Si bajas de plan, se aplicará al renovar tu suscripción actual.</p>
              </div>
            </details>

            {/* Pregunta 6 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Puedo cancelar mi suscripción?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí, puedes cancelar cuando quieras sin penalizaciones ni contratos de permanencia. Si cancelas, tendrás acceso al sistema hasta que termine tu período de facturación actual. Antes de que cierre tu cuenta, te permitimos exportar todos tus datos.</p>
              </div>
            </details>

            {/* Pregunta 7 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Funciona sin internet? ¿Qué pasa si se va la luz o internet?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>AstroDish requiere conexión a internet para funcionar. Si se va el internet temporalmente, puedes anotar las ventas en papel y registrarlas después. Estamos trabajando en un modo offline para versiones futuras.</p>
                <p style={{marginTop: '0.5rem'}}><strong>Recomendación:</strong> Ten un plan de datos móvil de respaldo (puedes usar el hotspot de tu celular) para casos de emergencia.</p>
              </div>
            </details>

            {/* Pregunta 8 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Puedo usar AstroDish en varios dispositivos al mismo tiempo?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí. Dependiendo de tu plan, puedes tener varios usuarios conectados simultáneamente. Por ejemplo, el Plan Lanzamiento permite 5 usuarios al mismo tiempo, perfecto para tener una caja principal y tablets para meseros o vendedores.</p>
              </div>
            </details>

            {/* Pregunta 9 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Mis datos están seguros? ¿Hacen respaldos?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí. Tus datos están protegidos con encriptación SSL y almacenados en servidores seguros en la nube. Hacemos respaldos automáticos diarios, así que nunca perderás información. Cumplimos con la Ley Federal de Protección de Datos Personales (LFPDPPP) de México.</p>
              </div>
            </details>

            {/* Pregunta 10 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Incluye capacitación o soporte?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí. Todos los planes incluyen:</p>
                <ul style={{marginTop: '0.5rem', marginLeft: '1.5rem', listStyle: 'disc'}}>
                  <li>Videos de capacitación paso a paso</li>
                  <li>Base de conocimientos con guías</li>
                  <li>Soporte por email</li>
                  <li>Soporte por WhatsApp (en planes superiores)</li>
                </ul>
                <p style={{marginTop: '0.5rem'}}>Además, si contratas el Plan Pro o Enterprise, puedes solicitar capacitación personalizada por videollamada.</p>
              </div>
            </details>

            {/* Pregunta 11 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Qué pasa si tengo un problema o pregunta?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Nuestro equipo de soporte está disponible de lunes a sábado de 9am a 7pm (hora CDMX) por WhatsApp y email. El tiempo promedio de respuesta es menos de 2 horas. Para planes Pro/Enterprise, ofrecemos soporte prioritario con respuesta en menos de 30 minutos.</p>
              </div>
            </details>

            {/* Pregunta 12 */}
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

            {/* Pregunta 13 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Puedo manejar varias sucursales?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>Sí. El Plan Pro te permite gestionar hasta 3 tiendas desde una sola cuenta. Puedes ver reportes consolidados o por sucursal individual. Para más de 3 tiendas, contáctanos para el Plan Enterprise.</p>
              </div>
            </details>

            {/* Pregunta 14 */}
            <details className="faq-item">
              <summary className="faq-question">
                ¿Funciona con mi impresora de tickets?
                <span className="faq-icon">+</span>
              </summary>
              <div className="faq-answer">
                <p>AstroDish es compatible con la mayoría de impresoras térmicas de tickets que usan conexión USB o Bluetooth. También puedes imprimir facturas directamente desde el sistema en cualquier impresora normal.</p>
              </div>
            </details>
          </div>

          {/* CTA al final */}
          <div style={{textAlign: 'center', marginTop: '4rem', padding: '3rem 1.5rem', background: 'var(--gray-50)', borderRadius: '12px'}}>
            <h2 style={{fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--gray-900)'}}>¿Listo para empezar?</h2>
            <p style={{fontSize: '1.1rem', color: 'var(--gray-600)', marginBottom: '2rem'}}>
              Únete a cientos de negocios que ya confían en AstroDish
            </p>
            <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
              <a href={`${APP_URL}/pricing`} className="btn-primary btn-large" style={{color: '#ffffff'}}>
                Ver Planes
              </a>
              <a href="/#/contact" className="btn-outline btn-large">
                Contáctanos
              </a>
            </div>
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

export default FAQPage;
