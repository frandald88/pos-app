/**
 * Templates HTML profesionales para emails
 * - Responsive (mobile-friendly)
 * - Compatible con todos los clientes de email
 * - Diseño moderno y limpio
 */

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
  <title>POS App</title>
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
      <h1 class="email-logo">🔐 POS App</h1>
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
          ⏱️ <strong>Este enlace expira en ${expiresInMinutes} minutos</strong> por razones de seguridad.
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
        © ${new Date().getFullYear()} POS App. Todos los derechos reservados.
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
      <h1 class="email-logo">✅ POS App</h1>
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
          ✅ <strong>Cambio realizado:</strong> ${formattedDate}
        </p>
      </div>

      <p class="email-text">
        Ya puedes iniciar sesión con tu nueva contraseña en cualquier momento.
      </p>

      <div class="divider"></div>

      <!-- Security Warning -->
      <div class="email-warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #856404;">
          ⚠️ <strong>¿No fuiste tú?</strong><br>
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
        © ${new Date().getFullYear()} POS App. Todos los derechos reservados.
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
      <h1 class="email-logo">👋 Bienvenido</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">¡Tu cuenta está lista!</h2>

      <p class="email-text">
        Hola <strong>${username}</strong>,
      </p>

      <p class="email-text">
        Nos complace darte la bienvenida a POS App. Tu cuenta ha sido creada exitosamente
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
        © ${new Date().getFullYear()} POS App. Todos los derechos reservados.
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
      <h1 class="email-logo">🎉 Bienvenido al Equipo</h1>
    </div>

    <!-- Body -->
    <div class="email-body">
      <h2 class="email-title">Tu Cuenta ha sido Creada</h2>

      <p class="email-text">
        Hola <strong>${username}</strong>,
      </p>

      <p class="email-text">
        Has sido agregado al sistema POS App. A continuación encontrarás tus credenciales
        de acceso para iniciar sesión.
      </p>

      <!-- Credentials Box -->
      <div class="email-info-box">
        <p class="email-text" style="margin: 0 0 10px 0;">
          <strong>📧 Usuario:</strong> ${email}
        </p>
        <p class="email-text" style="margin: 0;">
          <strong>🔑 Contraseña Temporal:</strong> <code style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${tempPassword}</code>
        </p>
      </div>

      <!-- Warning -->
      <div class="email-warning-box">
        <p class="email-text" style="margin: 0; font-size: 14px; color: #856404;">
          ⚠️ <strong>Importante:</strong> Esta es una contraseña temporal. Por tu seguridad,
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
        © ${new Date().getFullYear()} POS App. Todos los derechos reservados.
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

module.exports = {
  getPasswordResetTemplate,
  getPasswordChangedTemplate,
  getWelcomeTemplate,
  getNewUserCredentialsTemplate
};
