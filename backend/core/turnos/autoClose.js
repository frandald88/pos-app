const Turno = require('./model');
const Sale = require('../sales/model');

/**
 * Cierra automáticamente los turnos que han estado abiertos hasta las 11:59 PM
 * del día en que fueron abiertos
 */
async function cerrarTurnosAutomaticamente() {
  try {
    console.log('🕐 Ejecutando cierre automático de turnos...');

    // Obtener la fecha y hora actual
    const ahora = new Date();

    // Crear fecha límite: 11:59:59 PM del día actual
    const limiteCierre = new Date(ahora);
    limiteCierre.setHours(23, 59, 59, 999);

    // Buscar TODOS los turnos abiertos
    // A las 11:59 PM se cierran TODOS los turnos abiertos (del día actual y días anteriores)
    const turnosParaCerrar = await Turno.find({
      estado: 'abierto'
    }).populate('usuario', 'username')
      .populate('tienda', 'nombre');

    if (turnosParaCerrar.length === 0) {
      console.log('✅ No hay turnos para cerrar automáticamente');
      return { success: true, turnosCerrados: 0 };
    }

    console.log(`📋 Encontrados ${turnosParaCerrar.length} turno(s) para cerrar automáticamente`);

    let turnosCerrados = 0;

    for (const turno of turnosParaCerrar) {
      try {
        // Calcular el efectivo final basado en las ventas en efectivo del turno
        const ventasDelTurno = await Sale.find({
          turno: turno._id,
          status: { $ne: 'cancelada' }
        });

        let efectivoCalculado = turno.efectivoInicial;

        // Sumar ventas en efectivo
        for (const venta of ventasDelTurno) {
          if (venta.paymentType === 'single' && venta.method === 'efectivo') {
            efectivoCalculado += venta.total;
          } else if (venta.paymentType === 'mixed' && venta.mixedPayments) {
            venta.mixedPayments.forEach(pago => {
              if (pago.method === 'efectivo') {
                efectivoCalculado += pago.amount;
              }
            });
          }
        }

        // Cerrar el turno
        turno.estado = 'cerrado';

        // Establecer fecha de cierre a 11:59:59 PM del día actual
        turno.fechaCierre = new Date();
        turno.fechaCierre.setHours(23, 59, 59, 0);

        turno.efectivoFinal = efectivoCalculado;
        turno.notasCierre = 'Cierre automático por fin de jornada';
        turno.cierreRealizado = true;
        turno.usuarioCierre = turno.usuario; // El mismo usuario que abrió

        await turno.save();

        console.log(`✅ Turno cerrado automáticamente:
          - Tienda: ${turno.tienda?.nombre}
          - Usuario: ${turno.usuario?.username}
          - Fecha apertura: ${turno.fechaApertura.toLocaleString('es-MX')}
          - Efectivo calculado: $${efectivoCalculado.toFixed(2)}
        `);

        turnosCerrados++;
      } catch (error) {
        console.error(`❌ Error al cerrar turno ${turno._id}:`, error.message);
      }
    }

    console.log(`✅ Cierre automático completado: ${turnosCerrados}/${turnosParaCerrar.length} turnos cerrados`);

    return {
      success: true,
      turnosCerrados,
      totalEncontrados: turnosParaCerrar.length
    };

  } catch (error) {
    console.error('❌ Error en cierre automático de turnos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { cerrarTurnosAutomaticamente };
