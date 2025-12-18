import React, { useState } from 'react';
import './App.css';
import APP_URL from './config';

function TermsPage() {
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

      {/* Terms Content */}
      <section className="legal-content">
        <div className="container">
          <h1>Términos de Servicio</h1>

          <p className="effective-date">
            <strong>Fecha de vigencia:</strong> 15 de mayo de 2025
          </p>

          <p>
            Bienvenido a AstroDish POS. Al acceder y utilizar nuestros servicios, aceptas estos
            Términos de Servicio. Por favor, léelos cuidadosamente antes de usar nuestra plataforma.
          </p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al crear una cuenta, acceder o utilizar los servicios de AstroDish POS, aceptas estar
            legalmente obligado por estos Términos de Servicio y nuestra Política de Privacidad. Si no
            estás de acuerdo con alguno de estos términos, no debes utilizar nuestros servicios.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            AstroDish POS es una plataforma de punto de venta (POS) basada en la nube que permite a
            los negocios:
          </p>
          <ul>
            <li>Gestionar ventas e inventario</li>
            <li>Procesar diferentes métodos de pago</li>
            <li>Generar reportes y análisis</li>
            <li>Administrar empleados y turnos</li>
            <li>Gestionar múltiples sucursales</li>
            <li>Controlar gastos y devoluciones</li>
          </ul>

          <h2>3. Registro y Cuentas</h2>
          <p>Para utilizar AstroDish POS, debes:</p>
          <ul>
            <li>Ser mayor de 18 años o tener capacidad legal para contratar</li>
            <li>Proporcionar información precisa y completa durante el registro</li>
            <li>Mantener la seguridad de tu cuenta y contraseña</li>
            <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
          </ul>
          <p>
            Eres responsable de todas las actividades que ocurran bajo tu cuenta. AstroDish no será
            responsable por pérdidas causadas por el uso no autorizado de tu cuenta.
          </p>

          <h2>4. Planes y Pagos</h2>
          <p>
            AstroDish POS ofrece diferentes planes de suscripción. Al seleccionar un plan, aceptas:
          </p>
          <ul>
            <li>Pagar las tarifas aplicables según el plan seleccionado</li>
            <li>Que los pagos son procesados de forma segura a través de proveedores de pago terceros</li>
            <li>Que los precios pueden cambiar con previo aviso de 30 días</li>
            <li>Que los pagos realizados no son reembolsables, excepto donde la ley lo requiera</li>
          </ul>
          <p>
            <strong>Facturación:</strong> Los cargos se realizan al inicio del período de suscripción
            (mensual o anual según el plan). Es tu responsabilidad mantener información de pago válida.
          </p>

          <h2>5. Uso Aceptable</h2>
          <p>Al usar AstroDish POS, te comprometes a NO:</p>
          <ul>
            <li>Violar leyes o regulaciones aplicables</li>
            <li>Infringir derechos de propiedad intelectual de terceros</li>
            <li>Transmitir malware, virus o código malicioso</li>
            <li>Intentar acceder a sistemas o datos sin autorización</li>
            <li>Usar el servicio para actividades fraudulentas o ilegales</li>
            <li>Revender o redistribuir el servicio sin autorización</li>
            <li>Sobrecargar intencionalmente nuestros sistemas</li>
          </ul>

          <h2>6. Datos y Privacidad</h2>
          <p>
            <strong>Tus Datos:</strong> Conservas todos los derechos sobre los datos que ingresas en
            AstroDish POS. Nos otorgas una licencia limitada para procesar estos datos únicamente
            para proporcionar el servicio.
          </p>
          <p>
            <strong>Respaldos:</strong> Aunque realizamos respaldos regulares, te recomendamos mantener
            copias de seguridad de tu información crítica.
          </p>
          <p>
            <strong>Privacidad:</strong> El tratamiento de datos personales se rige por nuestra
            <a href="#/privacy"> Política de Privacidad</a>.
          </p>

          <h2>7. Propiedad Intelectual</h2>
          <p>
            AstroDish POS y todo su contenido, características y funcionalidad (incluyendo software,
            diseños, textos y gráficos) son propiedad de AstroDish y están protegidos por las leyes
            de propiedad intelectual de México y tratados internacionales.
          </p>
          <p>
            Se te otorga una licencia limitada, no exclusiva y no transferible para usar el servicio
            de acuerdo con estos términos. Esta licencia no incluye el derecho a:
          </p>
          <ul>
            <li>Modificar o crear obras derivadas del servicio</li>
            <li>Realizar ingeniería inversa del software</li>
            <li>Copiar o distribuir el servicio</li>
          </ul>

          <h2>8. Disponibilidad del Servicio</h2>
          <p>
            Nos esforzamos por mantener AstroDish POS disponible 24/7. Sin embargo, no garantizamos
            que el servicio esté libre de interrupciones. Pueden ocurrir:
          </p>
          <ul>
            <li>Mantenimientos programados (notificados con anticipación)</li>
            <li>Actualizaciones del sistema</li>
            <li>Interrupciones por causas fuera de nuestro control</li>
          </ul>

          <h2>9. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley, AstroDish no será responsable por:
          </p>
          <ul>
            <li>Daños indirectos, incidentales o consecuentes</li>
            <li>Pérdida de datos, ingresos o beneficios</li>
            <li>Interrupciones del negocio</li>
            <li>Daños causados por terceros o eventos fuera de nuestro control</li>
          </ul>
          <p>
            Nuestra responsabilidad total no excederá el monto pagado por ti en los últimos 12 meses
            de servicio.
          </p>

          <h2>10. Indemnización</h2>
          <p>
            Aceptas indemnizar y mantener libre de responsabilidad a AstroDish, sus directivos,
            empleados y agentes, de cualquier reclamo, daño o gasto (incluyendo honorarios legales)
            que surjan de:
          </p>
          <ul>
            <li>Tu uso del servicio</li>
            <li>Tu violación de estos términos</li>
            <li>Tu violación de derechos de terceros</li>
          </ul>

          <h2>11. Cancelación y Terminación</h2>
          <p><strong>Por el Usuario:</strong></p>
          <ul>
            <li>Puedes cancelar tu suscripción en cualquier momento desde tu panel de administración</li>
            <li>La cancelación será efectiva al final del período de facturación actual</li>
            <li>Tendrás acceso al servicio hasta que termine el período pagado</li>
          </ul>
          <p><strong>Por AstroDish:</strong></p>
          <ul>
            <li>Podemos suspender o terminar tu cuenta por violación de estos términos</li>
            <li>En caso de falta de pago después de 15 días de vencimiento</li>
            <li>Si detectamos uso fraudulento o ilegal</li>
          </ul>
          <p>
            <strong>Efectos de la Terminación:</strong> Al terminar, perderás acceso a tu cuenta y datos.
            Te recomendamos exportar tu información antes de cancelar.
          </p>

          <h2>12. Modificaciones a los Términos</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios
            entrarán en vigor:
          </p>
          <ul>
            <li>30 días después de publicarse para cambios materiales</li>
            <li>Inmediatamente para cambios menores o requeridos por ley</li>
          </ul>
          <p>
            Te notificaremos cambios importantes por correo electrónico. El uso continuado del servicio
            después de los cambios constituye aceptación de los nuevos términos.
          </p>

          <h2>13. Ley Aplicable y Jurisdicción</h2>
          <p>
            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier disputa
            será sometida a la jurisdicción de los tribunales competentes de la Ciudad de México,
            renunciando a cualquier otro fuero que pudiera corresponder.
          </p>

          <h2>14. Disposiciones Generales</h2>
          <ul>
            <li>
              <strong>Divisibilidad:</strong> Si alguna disposición es inválida, las demás permanecen
              en vigor.
            </li>
            <li>
              <strong>Renuncia:</strong> La falta de ejercicio de un derecho no implica renuncia al mismo.
            </li>
            <li>
              <strong>Cesión:</strong> No puedes ceder estos términos sin nuestro consentimiento escrito.
            </li>
            <li>
              <strong>Acuerdo Completo:</strong> Estos términos constituyen el acuerdo completo entre
              las partes.
            </li>
          </ul>

          <h2>15. Contacto</h2>
          <p>
            Si tienes preguntas sobre estos Términos de Servicio, contáctanos en:
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

export default TermsPage;
