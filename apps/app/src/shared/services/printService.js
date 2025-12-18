/**
 * Servicio de Impresión
 * Maneja la impresión directa y con diálogo según configuración de la tienda
 */

class PrintService {
  /**
   * Verifica si el Print Server está disponible
   * @param {string} serverUrl - URL del servidor de impresión
   * @returns {Promise<boolean>}
   */
  static async checkPrintServerHealth(serverUrl) {
    try {
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Timeout de 2 segundos
        signal: AbortSignal.timeout(2000)
      });

      return response.ok;
    } catch (error) {
      console.warn('⚠️ Print Server no disponible:', error.message);
      return false;
    }
  }

  /**
   * Imprime un ticket
   * @param {Object} sale - Datos de la venta
   * @param {Object} storeConfig - Configuración de la tienda
   * @param {Function} printWithDialog - Función fallback para imprimir con diálogo
   * @returns {Promise<Object>} - Resultado de la impresión
   */
  static async printTicket(sale, storeConfig, printWithDialog) {
    console.log('🖨️ PrintService.printTicket llamado');
    console.log('📋 Store Config:', storeConfig);

    // Verificar si la impresión directa está habilitada
    if (storeConfig?.printConfig?.directPrint) {
      console.log('✅ Impresión directa HABILITADA');

      try {
        const serverUrl = storeConfig.printConfig.printServerUrl || 'http://localhost:9100';

        // Verificar que el servidor esté disponible
        const isServerAvailable = await this.checkPrintServerHealth(serverUrl);

        if (!isServerAvailable) {
          console.warn('⚠️ Print Server no disponible, usando fallback');
          return this.printWithDialog(printWithDialog, 'dialog - server unavailable');
        }

        // Intentar impresión directa
        const response = await fetch(`${serverUrl}/print/ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sale,
            config: storeConfig.printConfig,
            ticketConfig: storeConfig.ticketConfig
          }),
          // Timeout de 10 segundos para la impresión
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Impresión directa exitosa:', result);
          return {
            success: true,
            method: 'direct',
            message: 'Ticket impreso directamente'
          };
        } else {
          const error = await response.json();
          console.error('❌ Error en Print Server:', error);
          throw new Error(error.error || 'Error desconocido');
        }
      } catch (error) {
        console.error('❌ Error en impresión directa:', error);
        console.log('🔄 Fallback a diálogo de impresión');

        // FALLBACK: Si falla, usar diálogo normal
        return this.printWithDialog(printWithDialog, 'dialog - direct print failed');
      }
    } else {
      console.log('ℹ️ Impresión directa DESHABILITADA, usando diálogo');
      // Usar diálogo normal
      return this.printWithDialog(printWithDialog, 'dialog');
    }
  }

  /**
   * Imprime una comanda
   * @param {Object} sale - Datos de la venta
   * @param {Object} storeConfig - Configuración de la tienda
   * @param {Function} printWithDialog - Función fallback para imprimir con diálogo
   * @returns {Promise<Object>} - Resultado de la impresión
   */
  static async printComanda(sale, storeConfig, printWithDialog) {
    console.log('🖨️ PrintService.printComanda llamado');

    // Verificar si la impresión directa de comandas está habilitada
    if (storeConfig?.printConfig?.directPrint && storeConfig?.printConfig?.comandaConfig?.enabled) {
      console.log('✅ Impresión directa de comanda HABILITADA');

      try {
        const serverUrl = storeConfig.printConfig.printServerUrl || 'http://localhost:9100';

        // Verificar que el servidor esté disponible
        const isServerAvailable = await this.checkPrintServerHealth(serverUrl);

        if (!isServerAvailable) {
          console.warn('⚠️ Print Server no disponible, usando fallback');
          return this.printWithDialog(printWithDialog, 'dialog - server unavailable');
        }

        // Intentar impresión directa
        const response = await fetch(`${serverUrl}/print/comanda`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sale,
            config: storeConfig.printConfig
          }),
          // Timeout de 10 segundos
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Comanda impresa directamente:', result);
          return {
            success: true,
            method: 'direct',
            message: 'Comanda impresa directamente'
          };
        } else {
          const error = await response.json();
          console.error('❌ Error en Print Server:', error);
          throw new Error(error.error || 'Error desconocido');
        }
      } catch (error) {
        console.error('❌ Error en impresión directa de comanda:', error);
        console.log('🔄 Fallback a diálogo de impresión');

        // FALLBACK: Si falla, usar diálogo normal
        return this.printWithDialog(printWithDialog, 'dialog - direct print failed');
      }
    } else {
      console.log('ℹ️ Impresión directa de comanda DESHABILITADA, usando diálogo');
      // Usar diálogo normal
      return this.printWithDialog(printWithDialog, 'dialog');
    }
  }

  /**
   * Función helper para imprimir con diálogo
   * @param {Function} printFunction - Función que ejecuta window.print()
   * @param {string} reason - Razón del uso del diálogo
   * @returns {Object}
   */
  static printWithDialog(printFunction, reason = 'dialog') {
    console.log(`📄 Usando diálogo de impresión (${reason})`);

    if (printFunction && typeof printFunction === 'function') {
      printFunction();
    }

    return {
      success: true,
      method: reason,
      message: 'Imprimiendo con diálogo del sistema'
    };
  }

  /**
   * Obtener configuración de impresión de una tienda
   * @param {Object} tienda - Datos de la tienda
   * @returns {Object}
   */
  static getPrintConfig(tienda) {
    return {
      printConfig: tienda?.printConfig || { directPrint: false },
      ticketConfig: tienda?.ticketConfig || {}
    };
  }
}

export default PrintService;
