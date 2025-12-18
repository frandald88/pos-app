const Tenant = require('../../core/tenants/model');
const emailService = require('./emailService');

/**
 * Servicio para gestionar recordatorios de expiración de suscripción
 * y suspensión automática de cuentas
 */
class SubscriptionReminderService {

  /**
   * Ejecutar chequeo de suscripciones
   * Debe llamarse diariamente (cron job)
   */
  async checkSubscriptions() {
    console.log('Iniciando chequeo de suscripciones...');

    try {
      // Obtener todos los tenants activos con pagos one-time
      const tenants = await Tenant.find({
        isActive: true,
        'subscription.isOneTimePayment': true,
        'subscription.status': 'active'
      });

      console.log(`Encontrados ${tenants.length} tenants con pagos one-time activos`);

      for (const tenant of tenants) {
        await this.processTenant(tenant);
      }

      console.log('Chequeo de suscripciones completado');

    } catch (error) {
      console.error('Error en chequeo de suscripciones:', error);
    }
  }

  /**
   * Procesar un tenant individual
   */
  async processTenant(tenant) {
    const now = new Date();
    const endDate = new Date(tenant.subscription.currentPeriodEnd);
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    console.log(`Procesando tenant: ${tenant.companyName} - ${daysRemaining} días restantes`);

    // Recordatorio a los 30 días restantes (día 60 de 90)
    if (daysRemaining <= 30 && daysRemaining > 29 && !tenant.subscription.remindersSent?.day60) {
      await this.send30DayReminder(tenant);
      tenant.subscription.remindersSent.day60 = true;
      await tenant.save();
    }

    // Recordatorio a los 10 días restantes (día 80 de 90)
    if (daysRemaining <= 10 && daysRemaining > 9 && !tenant.subscription.remindersSent?.day80) {
      await this.send10DayReminder(tenant);
      tenant.subscription.remindersSent.day80 = true;
      await tenant.save();
    }

    // Recordatorio final (día de expiración)
    if (daysRemaining <= 0 && !tenant.subscription.remindersSent?.day90) {
      await this.sendExpirationReminder(tenant);
      tenant.subscription.remindersSent.day90 = true;
      await tenant.save();
    }

    // Suspender cuenta si ya expiró
    if (daysRemaining < 0) {
      await this.suspendTenant(tenant);
    }
  }

  /**
   * Enviar recordatorio de 30 días
   */
  async send30DayReminder(tenant) {
    console.log(`Enviando recordatorio de 30 días a: ${tenant.contact.email}`);

    try {
      const html = this.get30DayReminderTemplate(tenant);

      await emailService.sendEmail({
        to: tenant.contact.email,
        subject: 'Tu plan expira en 30 días - Renueva ahora',
        html
      });

      console.log('Recordatorio de 30 días enviado exitosamente');
    } catch (error) {
      console.error('Error enviando recordatorio de 30 días:', error);
    }
  }

  /**
   * Enviar recordatorio de 10 días
   */
  async send10DayReminder(tenant) {
    console.log(`Enviando recordatorio de 10 días a: ${tenant.contact.email}`);

    try {
      const html = this.get10DayReminderTemplate(tenant);

      await emailService.sendEmail({
        to: tenant.contact.email,
        subject: 'Urgente: Tu plan expira en 10 días',
        html
      });

      console.log('Recordatorio de 10 días enviado exitosamente');
    } catch (error) {
      console.error('Error enviando recordatorio de 10 días:', error);
    }
  }

  /**
   * Enviar notificación de expiración
   */
  async sendExpirationReminder(tenant) {
    console.log(`Enviando notificación de expiración a: ${tenant.contact.email}`);

    try {
      const html = this.getExpirationReminderTemplate(tenant);

      await emailService.sendEmail({
        to: tenant.contact.email,
        subject: 'Tu plan ha expirado - Renueva para continuar',
        html
      });

      console.log('Notificación de expiración enviada exitosamente');
    } catch (error) {
      console.error('Error enviando notificación de expiración:', error);
    }
  }

  /**
   * Suspender tenant
   */
  async suspendTenant(tenant) {
    if (tenant.subscription.status === 'suspended') {
      return; // Ya está suspendido
    }

    console.log(`Suspendiendo tenant: ${tenant.companyName}`);

    try {
      tenant.subscription.status = 'suspended';
      tenant.isActive = false;
      tenant.suspendedAt = new Date();
      tenant.suspensionReason = 'Subscription expired (one-time payment period ended)';

      await tenant.save();

      console.log('Tenant suspendido exitosamente');
    } catch (error) {
      console.error('Error suspendiendo tenant:', error);
    }
  }

  /**
   * Template para recordatorio de 30 días
   */
  get30DayReminderTemplate(tenant) {
    const renewUrl = `${process.env.FRONTEND_URL}/admin/pricing`;
    const expirationDate = new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString('es-MX');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #46546b 0%, #23334e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #46546b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #8c95a4; font-size: 12px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tu Plan Expira Pronto</h1>
          </div>
          <div class="content">
            <p>Hola ${tenant.companyName},</p>

            <p>Tu plan de <strong>Lanzamiento</strong> expira el <strong>${expirationDate}</strong> (en 30 días).</p>

            <div class="warning">
              <strong>Qué significa esto:</strong><br>
              • Después de esta fecha, tu cuenta será suspendida<br>
              • No podrás acceder al sistema<br>
              • Tus datos se mantendrán seguros por 90 días
            </div>

            <p><strong>Para continuar usando AstroDish:</strong></p>
            <ol>
              <li>Elige un plan anual (Básico o Pro)</li>
              <li>Realiza el pago</li>
              <li>Tu acceso continuará sin interrupciones</li>
            </ol>

            <div style="text-align: center;">
              <a href="${renewUrl}" class="button">Ver Planes y Renovar</a>
            </div>

            <p style="color: #697487; font-size: 14px; margin-top: 30px;">
              ¿Tienes dudas? Responde a este correo o contacta a soporte@astrodish.com
            </p>
          </div>
          <div class="footer">
            <p>AstroDish - Sistema de Gestión para Negocios</p>
            <p>Este es un correo automático, pero puedes responder si necesitas ayuda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para recordatorio de 10 días
   */
  get10DayReminderTemplate(tenant) {
    const renewUrl = `${process.env.FRONTEND_URL}/admin/pricing`;
    const expirationDate = new Date(tenant.subscription.currentPeriodEnd).toLocaleDateString('es-MX');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #8c95a4; font-size: 12px; }
          .urgent { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Urgente: 10 Días Restantes</h1>
          </div>
          <div class="content">
            <p>Hola ${tenant.companyName},</p>

            <div class="urgent">
              <strong>Tu plan expira el ${expirationDate} - Solo quedan 10 días</strong>
            </div>

            <p>Esta es tu última oportunidad para renovar antes de perder el acceso.</p>

            <p><strong>Actúa ahora para evitar:</strong></p>
            <ul>
              <li>Pérdida de acceso al sistema</li>
              <li>Interrupción de tus operaciones</li>
              <li>Inconvenientes con tu equipo</li>
            </ul>

            <div style="text-align: center;">
              <a href="${renewUrl}" class="button">Renovar Ahora</a>
            </div>

            <p style="margin-top: 30px;">
              <strong>¿Necesitas ayuda para decidir?</strong><br>
              Nuestro equipo está disponible en soporte@astrodish.com
            </p>
          </div>
          <div class="footer">
            <p>AstroDish - Sistema de Gestión para Negocios</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template para notificación de expiración
   */
  getExpirationReminderTemplate(tenant) {
    const renewUrl = `${process.env.FRONTEND_URL}/admin/pricing`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #46546b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #8c95a4; font-size: 12px; }
          .expired { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Tu Plan Ha Expirado</h1>
          </div>
          <div class="content">
            <p>Hola ${tenant.companyName},</p>

            <div class="expired">
              <strong>Tu plan de Lanzamiento ha expirado hoy</strong>
            </div>

            <p>Tu cuenta será suspendida automáticamente. Para recuperar el acceso:</p>

            <ol>
              <li>Elige un plan anual (Básico o Pro)</li>
              <li>Completa el pago</li>
              <li>Tu acceso se restaurará inmediatamente</li>
            </ol>

            <div style="text-align: center;">
              <a href="${renewUrl}" class="button">Renovar y Recuperar Acceso</a>
            </div>

            <p style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <strong>Tus datos están seguros:</strong><br>
              Conservaremos todos tus datos por 90 días. Si renuevas en este período, todo estará exactamente como lo dejaste.
            </p>

            <p>¿Necesitas ayuda? Contacta a soporte@astrodish.com</p>
          </div>
          <div class="footer">
            <p>AstroDish - Sistema de Gestión para Negocios</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new SubscriptionReminderService();
