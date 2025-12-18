import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

function PrivacyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <a href="/#features">Características</a>
              <a href={`${APP_URL}/pricing`}>Precios</a>
              <a href="/#contact">Contacto</a>
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
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem 0',
              borderTop: '1px solid var(--gray-200)',
              marginTop: '1rem'
            }}>
              <a href="/#features" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Características</a>
              <a href={`${APP_URL}/pricing`} onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Precios</a>
              <a href="/#contact" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none', color: 'var(--gray-700)', fontWeight: '500', padding: '0.5rem 0'}}>Contacto</a>
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
              <a href="/#features">Características</a>
              <a href={`${APP_URL}/pricing`}>Precios</a>
              <a href="/#contact">Contacto</a>
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

export default PrivacyPage;
