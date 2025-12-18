/**
 * Templates HTML profesionales para emails
 * - Responsive (mobile-friendly)
 * - Compatible con todos los clientes de email
 * - Diseño moderno y limpio
 */

// SVG Icons como strings para usar inline en emails
const svgIcons = {
  lock: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  checkCircle: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  wave: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5z"></path><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2z"></path><path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5z"></path><path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15z"></path></svg>`,
  party: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
  key: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>`
};

/**
 * Template base con estilos comunes
 */
const getBaseTemplate = (content) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Astrodish</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f6fa;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }

    .email-header {
      background: linear-gradient(135deg, #46546b 0%, #23334e 100%);
      padding: 40px 20px;
      text-align: center;
    }

    .email-logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      margin: 0;
    }

    .email-body {
      padding: 40px 30px;
    }

    .email-title {
      font-size: 24px;
      font-weight: 600;
      color: #23334e;
      margin-bottom: 20px;
      text-align: center;
    }

    .email-text {
      font-size: 16px;
      color: #697487;
      margin-bottom: 20px;
      line-height: 1.8;
    }

    .email-button {
      display: inline-block;
      padding: 16px 32px;
      background: linear-gradient(135deg, #46546b 0%, #23334e 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
    }

    .email-button-container {
      text-align: center;
      margin: 30px 0;
    }

    .email-info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #46546b;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .email-warning-box {
      background-color: #fff3cd;
      border-left: 4px solid #f59e0b;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .email-footer {
      background-color: #f8f9fa;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .email-footer-text {
      font-size: 14px;
      color: #8c95a4;
      margin: 5px 0;
    }

    .email-link {
      color: #46546b;
      text-decoration: none;
      word-break: break-all;
    }

    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }

    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px;
      }

      .email-title {
        font-size: 20px;
      }

      .email-text {
        font-size: 15px;
      }

      .email-button {
        padding: 14px 24px;
        font-size: 15px;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f6fa; padding: 20px 0;">
    <tr>
      <td align="center">
        <div class="email-container">
          ${content}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Template: Recuperación de Contraseña
 */
const getPasswordResetTemplate = ({ username, resetUrl, expiresInMinutes = 60 }) => {
  const content = `
    <!-- Header -->
    <div class="email-header">
      <h1 class="email-logo">${svgIcons.lock} Astrodish</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">Recuperación de Contraseña</h2>

      <p class="email-text">
        Hola <strong>${username}</strong>,
      </p>

      <p class="email-text">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        Si fuiste tú quien realizó esta solicitud, haz clic en el botón de abajo
        para crear una nueva contraseña.
      </p>

      <!-- Button -->
      <div class="email-button-container">
        <a href="${resetUrl}" class="email-button">
          Restablecer Contraseña
        </a>
      </div>

      <!-- Alternative Link -->
      <div class="email-info-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          <strong>Si el botón no funciona</strong>, copia y pega este enlace en tu navegador:
        </p>
        <p class="email-text" style="margin: 10px 0 0 0; font-size: 13px;">
          <a href="${resetUrl}" class="email-link">${resetUrl}</a>
        </p>
      </div>

      <!-- Warning -->
      <div class="email-warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #856404;">
          ${svgIcons.clock} <strong>Este enlace expira en ${expiresInMinutes} minutos</strong> por razones de seguridad.
          Si no restableces tu contraseña en este tiempo, deberás solicitar un nuevo enlace.
        </p>
      </div>

      <div class="divider"></div>

      <p class="email-text" style="font-size: 14px;">
        <strong>¿No solicitaste esto?</strong><br>
        Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
        Tu contraseña actual permanecerá sin cambios.
      </p>

      <p class="email-text" style="font-size: 14px; color: #8c95a4;">
        Por tu seguridad, nunca compartas este enlace con nadie. Nuestro equipo nunca te
        pedirá tu contraseña por correo electrónico o teléfono.
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="email-footer-text">
        © ${new Date().getFullYear()} Astrodish. Todos los derechos reservados.
      </p>
      <p class="email-footer-text">
        Este correo fue enviado automáticamente, por favor no respondas.
      </p>
    </div>
  `;

  return getBaseTemplate(content);
};

/**
 * Template: Confirmación de Cambio de Contraseña
 */
const getPasswordChangedTemplate = ({ username, changeDate }) => {
  const formattedDate = changeDate ?
    new Date(changeDate).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) :
    new Date().toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const content = `
    <!-- Header -->
    <div class="email-header">
      <h1 class="email-logo">${svgIcons.checkCircle} Astrodish</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">Contraseña Actualizada</h2>

      <p class="email-text">
        Hola <strong>${username}</strong>,
      </p>

      <p class="email-text">
        Te confirmamos que la contraseña de tu cuenta ha sido actualizada exitosamente.
      </p>

      <!-- Success Box -->
      <div class="email-info-box" style="border-left-color: #10b981; background-color: #f0fdf4;">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #065f46;">
          ${svgIcons.check} <strong>Cambio realizado:</strong> ${formattedDate}
        </p>
      </div>

      <p class="email-text">
        Ya puedes iniciar sesión con tu nueva contraseña en cualquier momento.
      </p>

      <div class="divider"></div>

      <!-- Security Warning -->
      <div class="email-warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #856404;">
          ${svgIcons.warning} <strong>¿No fuiste tú?</strong><br>
          Si no realizaste este cambio, tu cuenta podría estar comprometida.
          Contacta inmediatamente a tu administrador o equipo de soporte.
        </p>
      </div>

      <p class="email-text" style="font-size: 14px; color: #8c95a4;">
        <strong>Consejos de seguridad:</strong>
      </p>
      <ul style="color: #8c95a4; font-size: 14px; padding-left: 20px; margin: 10px 0;">
        <li>Usa una contraseña única para cada servicio</li>
        <li>No compartas tu contraseña con nadie</li>
        <li>Cambia tu contraseña periódicamente</li>
        <li>Usa una combinación de letras, números y símbolos</li>
      </ul>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="email-footer-text">
        © ${new Date().getFullYear()} Astrodish. Todos los derechos reservados.
      </p>
      <p class="email-footer-text">
        Este correo fue enviado automáticamente, por favor no respondas.
      </p>
    </div>
  `;

  return getBaseTemplate(content);
};

/**
 * Template: Email de Bienvenida (Bonus)
 */
const getWelcomeTemplate = ({ username, loginUrl }) => {
  const content = `
    <!-- Header -->
    <div class="email-header">
      <h1 class="email-logo">${svgIcons.wave} Bienvenido</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">¡Tu cuenta está lista!</h2>

      <p class="email-text">
        Hola <strong>${username}</strong>,
      </p>

      <p class="email-text">
        Nos complace darte la bienvenida a Astrodish. Tu cuenta ha sido creada exitosamente
        y ya puedes comenzar a usarla.
      </p>

      <!-- Button -->
      <div class="email-button-container">
        <a href="${loginUrl}" class="email-button">
          Iniciar Sesión
        </a>
      </div>

      <div class="divider"></div>

      <p class="email-text">
        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar a tu administrador.
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="email-footer-text">
        © ${new Date().getFullYear()} Astrodish. Todos los derechos reservados.
      </p>
    </div>
  `;

  return getBaseTemplate(content);
};

/**
 * Template: Email de Credenciales para Nuevo Usuario
 */
const getNewUserCredentialsTemplate = ({ username, email, tempPassword, loginUrl, changePasswordUrl }) => {
  const content = `
    <!-- Header -->
    <div class="email-header">
      <h1 class="email-logo">${svgIcons.party} Bienvenido al Equipo</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">Tu Cuenta ha sido Creada</h2>

      <p class="email-text">
        Hola <strong>${username}</strong>,
      </p>

      <p class="email-text">
        Has sido agregado al sistema Astrodish. A continuación encontrarás tus credenciales
        de acceso para iniciar sesión.
      </p>

      <!-- Credentials Box -->
      <div class="email-info-box">
        <p class="email-text" style="margin: 0 0 10px 0;">
          <strong>${svgIcons.mail} Usuario:</strong> ${email}
        </p>
        <p class="email-text" style="margin: 0;">
          <strong>${svgIcons.key} Contraseña Temporal:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${tempPassword}</code>
        </p>
      </div>

      <!-- Warning -->
      <div class="email-warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #856404;">
          ${svgIcons.warning} <strong>Importante:</strong> Esta es una contraseña temporal. Por tu seguridad,
          debes cambiarla en tu primer inicio de sesión.
        </p>
      </div>

      <!-- Login Button -->
      <div class="email-button-container">
        <a href="${loginUrl}" class="email-button">
          Iniciar Sesión Ahora
        </a>
      </div>

      ${changePasswordUrl ? `
      <!-- Alternative: Change Password Link -->
      <div style="text-align: center; margin: 20px 0;">
        <p class="email-text" style="margin: 0 0 10px 0; font-size: 14px;">
          O puedes cambiar tu contraseña directamente:
        </p>
        <a href="${changePasswordUrl}" class="email-link" style="font-size: 14px;">Cambiar Contraseña</a>
      </div>
      ` : ''}

      <div class="divider"></div>

      <p class="email-text" style="font-size: 14px;">
        <strong>Próximos pasos:</strong>
      </p>
      <ol style="color: #697487; font-size: 14px; padding-left: 20px; margin: 10px 0;">
        <li>Inicia sesión con las credenciales proporcionadas</li>
        <li>Cambia tu contraseña temporal por una segura</li>
        <li>Completa tu perfil con tus datos personales</li>
        <li>¡Comienza a trabajar con el sistema!</li>
      </ol>

      <p class="email-text" style="font-size: 14px; color: #8c95a4;">
        <strong>Consejos de seguridad:</strong><br>
        • No compartas tu contraseña con nadie<br>
        • Usa una contraseña fuerte (letras, números y símbolos)<br>
        • Nunca envíes tu contraseña por correo o mensaje
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="email-footer-text">
        © ${new Date().getFullYear()} Astrodish. Todos los derechos reservados.
      </p>
      <p class="email-footer-text">
        Este correo fue enviado automáticamente, por favor no respondas.
      </p>
      <p class="email-footer-text" style="margin-top: 10px;">
        Si necesitas ayuda, contacta a tu administrador.
      </p>
    </div>
  `;

  return getBaseTemplate(content);
};

/**
 * Template para activación de cuenta (nuevo usuario que pagó)
 */
const getAccountActivationTemplate = ({ companyName, activationUrl, expiresInHours = 48 }) => {
  const content = `
    <!-- Header -->
    <div class="email-header">
      <h1 class="email-logo">${svgIcons.party} Bienvenido a Astrodish</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">Tu Cuenta ha sido Creada</h2>

      <p class="email-text">
        Hola,
      </p>

      <p class="email-text">
        Gracias por confiar en Astrodish para <strong>${companyName}</strong>. Tu pago se ha procesado
        exitosamente y tu cuenta ha sido creada.
      </p>

      <p class="email-text">
        Para completar el proceso y comenzar a usar el sistema, necesitas activar tu cuenta y
        crear tu contraseña personal haciendo clic en el botón de abajo.
      </p>

      <!-- Activation Button -->
      <div class="email-button-container">
        <a href="${activationUrl}" class="email-button">
          Activar Mi Cuenta
        </a>
      </div>

      <!-- Alternative Link -->
      <div class="email-info-box">
        <p class="email-text" style="margin: 0; font-size: 14px;">
          <strong>Si el botón no funciona</strong>, copia y pega este enlace en tu navegador:
        </p>
        <p class="email-text" style="margin: 10px 0 0 0; font-size: 13px;">
          <a href="${activationUrl}" class="email-link">${activationUrl}</a>
        </p>
      </div>

      <!-- Warning -->
      <div class="email-warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #856404;">
          ${svgIcons.clock} <strong>Este enlace expira en ${expiresInHours} horas</strong> por razones de seguridad.
          Si no activas tu cuenta en este tiempo, deberás contactar a soporte.
        </p>
      </div>

      <div class="divider"></div>

      <p class="email-text" style="font-size: 14px;">
        <strong>Próximos pasos:</strong>
      </p>
      <ol style="color: #697487; font-size: 14px; padding-left: 20px; margin: 10px 0;">
        <li>Haz clic en el botón "Activar Mi Cuenta"</li>
        <li>Crea una contraseña segura (mínimo 6 caracteres)</li>
        <li>Confirma tu contraseña</li>
        <li>¡Comienza a usar Astrodish inmediatamente!</li>
      </ol>

      <p class="email-text" style="font-size: 14px;">
        <strong>Qué incluye tu cuenta:</strong>
      </p>
      <ul style="color: #697487; font-size: 14px; padding-left: 20px; margin: 10px 0;">
        <li>Acceso completo a todas las funcionalidades</li>
        <li>Módulos de ventas, inventario, reportes y más</li>
        <li>Soporte técnico incluido</li>
        <li>Actualizaciones automáticas</li>
      </ul>

      <div class="divider"></div>

      <p class="email-text" style="font-size: 14px;">
        <strong>¿No solicitaste esto?</strong><br>
        Si no realizaste este pago ni creaste esta cuenta, por favor contacta inmediatamente
        a nuestro equipo de soporte.
      </p>

      <p class="email-text" style="font-size: 14px; color: #8c95a4;">
        <strong>Consejos de seguridad:</strong><br>
        • No compartas tu contraseña con nadie<br>
        • Usa una contraseña fuerte (letras, números y símbolos)<br>
        • Nunca envíes tu contraseña por correo o mensaje
      </p>
    </div>

    <!-- Footer -->
    <div class="email-footer">
      <p class="email-footer-text">
        © ${new Date().getFullYear()} Astrodish. Todos los derechos reservados.
      </p>
      <p class="email-footer-text">
        Este correo fue enviado automáticamente, por favor no respondas.
      </p>
      <p class="email-footer-text" style="margin-top: 10px;">
        Si necesitas ayuda, contacta a: soporte@astrodish.com
      </p>
    </div>
  `;

  return getBaseTemplate(content);
};

module.exports = {
  getPasswordResetTemplate,
  getPasswordChangedTemplate,
  getWelcomeTemplate,
  getNewUserCredentialsTemplate,
  getAccountActivationTemplate
};
