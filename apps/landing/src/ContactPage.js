import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState({ type: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);

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

      {/* Contact Content */}
      <section className="legal-content">
        <div className="container">
          <h1>Contáctanos</h1>

          <p className="intro">
            ¿Tienes preguntas o necesitas ayuda? Estamos aquí para ti. Completa el formulario
            y nuestro equipo te responderá lo antes posible.
          </p>

          <div style={{
            maxWidth: '800px',
            margin: '3rem auto',
            background: 'white',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: 'var(--shadow)'
          }}>
            <form onSubmit={handleContactSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-800)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={contactForm.name}
                  onChange={handleContactChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  placeholder="Tu nombre"
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-800)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={contactForm.email}
                  onChange={handleContactChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  placeholder="tu@email.com"
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-800)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={contactForm.phone}
                  onChange={handleContactChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  placeholder="+52 123 456 7890"
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-800)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Nombre de tu negocio (opcional)
                </label>
                <input
                  type="text"
                  name="company"
                  value={contactForm.company}
                  onChange={handleContactChange}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    outline: 'none'
                  }}
                  placeholder="Mi Negocio S.A."
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: 'var(--gray-800)',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Mensaje *
                </label>
                <textarea
                  name="message"
                  required
                  value={contactForm.message}
                  onChange={handleContactChange}
                  rows="6"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>

              {contactStatus.message && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  backgroundColor: contactStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
                  color: contactStatus.type === 'success' ? '#065f46' : '#991b1b',
                  fontSize: '0.95rem'
                }}>
                  {contactStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={contactLoading}
                className="btn-primary btn-large"
                style={{
                  width: '100%',
                  cursor: contactLoading ? 'wait' : 'pointer',
                  opacity: contactLoading ? 0.7 : 1
                }}
              >
                {contactLoading ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>

          <div style={{
            maxWidth: '800px',
            margin: '3rem auto',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--gray-800)' }}>Otras formas de contacto</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginTop: '2rem'
            }}>
              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'white'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '24px', height: '24px'}}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                  Email
                </h3>
                <p style={{ color: 'var(--gray-600)', margin: 0 }}>
                  <a href="mailto:soporte@astrometrika.net" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    soporte@astrometrika.net
                  </a>
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: 'var(--shadow)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'white'
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '24px', height: '24px'}}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                  Soporte Técnico
                </h3>
                <p style={{ color: 'var(--gray-600)', margin: 0, fontSize: '0.9rem' }}>
                  Disponible de Lun-Vie<br/>9:00 AM - 6:00 PM
                </p>
              </div>
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

export default ContactPage;
