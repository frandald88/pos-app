const nodemailer = require('nodemailer');

/**
 * Servicio de Email configurable
 * Soporta: Mailtrap (development), SendGrid (production), Gmail, SMTP custom
 * Configuración mediante variables de entorno
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@pos-app.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'POS App';
    this.initialize();
  }

  /**
   * Inicializar transporter según configuración
   */
  initialize() {
    const emailService = process.env.EMAIL_SERVICE || 'mailtrap';

    console.log(`📧 Inicializando servicio de email: ${emailService}`);

    switch (emailService.toLowerCase()) {
      case 'mailtrap':
        this.transporter = this.createMailtrapTransporter();
        break;

      case 'sendgrid':
        this.transporter = this.createSendGridTransporter();
        break;

      case 'gmail':
        this.transporter = this.createGmailTransporter();
        break;

      case 'smtp':
        this.transporter = this.createSMTPTransporter();
        break;

      default:
        console.warn(`⚠️ Servicio de email desconocido: ${emailService}. Usando Mailtrap por defecto.`);
        this.transporter = this.createMailtrapTransporter();
    }
  }

  /**
   * Crear transporter para Mailtrap (Development/Testing)
   */
  createMailtrapTransporter() {
    console.log('🔍 Verificando credenciales de Mailtrap...');
    console.log('MAILTRAP_USER:', process.env.MAILTRAP_USER ? '✅ Presente' : '❌ No encontrado');
    console.log('MAILTRAP_PASS:', process.env.MAILTRAP_PASS ? '✅ Presente' : '❌ No encontrado');
    console.log('MAILTRAP_HOST:', process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io (default)');
    console.log('MAILTRAP_PORT:', process.env.MAILTRAP_PORT || '2525 (default)');

    if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      console.error('❌ Configuración de Mailtrap incompleta. Verifica MAILTRAP_USER y MAILTRAP_PASS');
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_PORT || '2525'),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      }
    });

    console.log('✅ Transporter de Mailtrap creado exitosamente');
    return transporter;
  }

  /**
   * Crear transporter para SendGrid (Production)
   */
  createSendGridTransporter() {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY no configurado');
      return null;
    }

    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  /**
   * Crear transporter para Gmail (Testing/Development)
   */
  createGmailTransporter() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('❌ Configuración de Gmail incompleta');
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS // App Password, no contraseña normal
      }
    });
  }

  /**
   * Crear transporter para SMTP custom (Production con hosting propio)
   */
  createSMTPTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Configuración SMTP incompleta');
      return null;
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Enviar email
   * @param {Object} options - Opciones de email
   * @param {string} options.to - Email destinatario
   * @param {string} options.subject - Asunto
   * @param {string} options.html - Contenido HTML
   * @param {string} options.text - Contenido texto plano (opcional)
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      throw new Error('Servicio de email no configurado correctamente');
    }

    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.from}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html) // Si no hay texto plano, extraer del HTML
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`✅ Email enviado: ${info.messageId}`);
      console.log(`   Para: ${to}`);
      console.log(`   Asunto: ${subject}`);

      // En Mailtrap, mostrar link de preview
      if (process.env.EMAIL_SERVICE === 'mailtrap' && info.response) {
        console.log(`   Preview: https://mailtrap.io/inboxes`);
      }

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail({ to, username, resetUrl, expiresInMinutes = 60 }) {
    const html = this.getPasswordResetTemplate({ username, resetUrl, expiresInMinutes });

    return await this.sendEmail({
      to,
      subject: 'Recuperación de Contraseña - POS App',
      html
    });
  }

  /**
   * Enviar email de confirmación de cambio de contraseña
   */
  async sendPasswordChangedEmail({ to, username, changeDate }) {
    const html = this.getPasswordChangedTemplate({ username, changeDate: changeDate || new Date() });

    return await this.sendEmail({
      to,
      subject: 'Contraseña Actualizada - POS App',
      html
    });
  }

  /**
   * Enviar email con credenciales para nuevo usuario
   */
  async sendNewUserCredentialsEmail({ to, username, email, tempPassword, loginUrl, changePasswordUrl }) {
    const html = this.getNewUserCredentialsTemplate({
      username,
      email,
      tempPassword,
      loginUrl,
      changePasswordUrl
    });

    return await this.sendEmail({
      to,
      subject: '🎉 Bienvenido al Equipo - Tus Credenciales de Acceso',
      html
    });
  }

  /**
   * Template HTML para recuperación de contraseña
   */
  getPasswordResetTemplate({ username, resetUrl, expiresInMinutes }) {
    const templates = require('../templates/emailTemplates');
    return templates.getPasswordResetTemplate({ username, resetUrl, expiresInMinutes });
  }

  /**
   * Template HTML para confirmación de cambio
   */
  getPasswordChangedTemplate({ username, changeDate }) {
    const templates = require('../templates/emailTemplates');
    return templates.getPasswordChangedTemplate({ username, changeDate });
  }

  /**
   * Template HTML para credenciales de nuevo usuario
   */
  getNewUserCredentialsTemplate({ username, email, tempPassword, loginUrl, changePasswordUrl }) {
    const templates = require('../templates/emailTemplates');
    return templates.getNewUserCredentialsTemplate({ username, email, tempPassword, loginUrl, changePasswordUrl });
  }

  /**
   * Remover HTML tags para generar texto plano
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Verificar conexión del servicio de email
   */
  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Transporter no inicializado');
    }

    try {
      await this.transporter.verify();
      console.log('✅ Servicio de email verificado y listo');
      return true;
    } catch (error) {
      console.error('❌ Error verificando servicio de email:', error);
      throw error;
    }
  }
}

// Exportar instancia única (Singleton)
module.exports = new EmailService();
