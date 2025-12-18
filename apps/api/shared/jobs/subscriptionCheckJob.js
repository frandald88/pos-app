const cron = require('node-cron');
const subscriptionReminderService = require('../services/subscriptionReminderService');

/**
 * Cron job para chequear suscripciones diariamente
 * Se ejecuta todos los días a las 9:00 AM
 */
class SubscriptionCheckJob {

  start() {
    // Ejecutar todos los días a las 9:00 AM (hora del servidor)
    // Formato: segundo minuto hora día mes día-semana
    const schedule = '0 9 * * *'; // 9:00 AM todos los días

    console.log('Iniciando cron job de chequeo de suscripciones...');
    console.log('Horario: Todos los días a las 9:00 AM');

    this.job = cron.schedule(schedule, async () => {
      console.log(`[${new Date().toISOString()}] Ejecutando chequeo de suscripciones...`);

      try {
        await subscriptionReminderService.checkSubscriptions();
      } catch (error) {
        console.error('Error en cron job de suscripciones:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/Mexico_City"
    });

    console.log('Cron job de suscripciones iniciado exitosamente');

    // Ejecutar también al iniciar el servidor (para testing)
    if (process.env.NODE_ENV === 'development') {
      console.log('Modo desarrollo: Ejecutando chequeo inicial...');
      setTimeout(async () => {
        try {
          await subscriptionReminderService.checkSubscriptions();
        } catch (error) {
          console.error('Error en chequeo inicial:', error);
        }
      }, 5000); // Esperar 5 segundos después de iniciar
    }
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('Cron job de suscripciones detenido');
    }
  }

  /**
   * Ejecutar manualmente (útil para testing)
   */
  async runNow() {
    console.log('Ejecutando chequeo manual de suscripciones...');
    try {
      await subscriptionReminderService.checkSubscriptions();
      return { success: true, message: 'Chequeo completado' };
    } catch (error) {
      console.error('Error en chequeo manual:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SubscriptionCheckJob();
