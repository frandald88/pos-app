const Turno = require('../../core/turnos/model');
const Sale = require('../../core/sales/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const os = require('os');

class TurnoController {

  /**
   * Obtener tiendas disponibles para el usuario según su rol
   */
  async getTiendasDisponibles(req, res) {
    try {
      const User = require('../../core/users/model');
      const Tienda = require('../../modules/tiendas/model');

      const usuario = await User.findById(req.userId);

      if (!usuario) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      let tiendas;

      // Si es admin, puede ver todas las tiendas activas
      if (usuario.role === 'admin') {
        tiendas = await Tienda.find({
          $or: [
            { activa: true },
            { activa: { $exists: false } }
          ]
        }).select('nombre direccion telefono').sort({ nombre: 1 });
      } else {
        // Si no es admin, solo puede ver su tienda asignada
        if (!usuario.tienda) {
          return successResponse(res, { tiendas: [] });
        }

        const tienda = await Tienda.findById(usuario.tienda)
          .select('nombre direccion telefono');

        tiendas = tienda ? [tienda] : [];
      }

      return successResponse(res, { tiendas });
    } catch (error) {
      console.error('Error al obtener tiendas disponibles:', error);
      return errorResponse(res, 'Error al obtener tiendas disponibles', 500);
    }
  }

  /**
   * Obtener el turno activo de la tienda del usuario o de una tienda específica
   * - Si se proporciona tiendaId en query params, busca turno de esa tienda (solo admin)
   * - Si es admin sin tienda asignada y sin tiendaId, busca su propio turno
   * - Si tiene tienda asignada, ve el turno activo de su tienda
   */
  async getTurnoActivo(req, res) {
    try {
      const User = require('../../core/users/model');
      const usuario = await User.findById(req.userId);

      if (!usuario) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      let turnoActivo;
      const { tiendaId } = req.query;

      // Si se proporciona tiendaId, buscar turno de esa tienda específica
      // Solo permitido para admins
      if (tiendaId) {
        if (usuario.role !== 'admin') {
          return errorResponse(res, 'No tienes permiso para consultar turnos de otras tiendas', 403);
        }

        turnoActivo = await Turno.findOne({
          tienda: tiendaId,
          estado: 'abierto'
        })
        .populate('usuario', 'username')
        .populate('usuarioCierre', 'username')
        .populate('tienda', 'nombre')
        .sort({ fechaApertura: -1 });
      }
      // Si el usuario tiene tienda asignada, buscar turno activo de esa tienda
      else if (usuario.tienda) {
        turnoActivo = await Turno.findOne({
          tienda: usuario.tienda,
          estado: 'abierto'
        })
        .populate('usuario', 'username')
        .populate('usuarioCierre', 'username')
        .populate('tienda', 'nombre')
        .sort({ fechaApertura: -1 });
      } else {
        // Si es admin sin tienda, buscar su propio turno activo
        turnoActivo = await Turno.findOne({
          usuario: req.userId,
          estado: 'abierto'
        })
        .populate('usuario', 'username')
        .populate('usuarioCierre', 'username')
        .populate('tienda', 'nombre')
        .sort({ fechaApertura: -1 });
      }

      if (!turnoActivo) {
        return successResponse(res, { turno: null, message: 'No hay turno activo' });
      }

      return successResponse(res, { turno: turnoActivo });
    } catch (error) {
      console.error('Error al obtener turno activo:', error);
      return errorResponse(res, 'Error al obtener el turno activo', 500);
    }
  }

  /**
   * Iniciar un nuevo turno
   */
  async iniciarTurno(req, res) {
    try {
      const { efectivoInicial, tienda, notasApertura } = req.body;

      // Validaciones
      if (!efectivoInicial || efectivoInicial < 0) {
        return errorResponse(res, 'El efectivo inicial es requerido y debe ser mayor o igual a 0', 400);
      }

      if (!tienda) {
        return errorResponse(res, 'La tienda es requerida', 400);
      }

      // Obtener datos del usuario para validar permisos
      const User = require('../../core/users/model');
      const usuario = await User.findById(req.userId);

      if (!usuario) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Si NO es admin, validar que la tienda coincida con su tienda asignada
      if (usuario.role !== 'admin') {
        if (!usuario.tienda) {
          return errorResponse(res, 'No tienes una tienda asignada. Contacta al administrador', 403);
        }

        if (usuario.tienda.toString() !== tienda) {
          return errorResponse(res, 'No tienes permiso para iniciar turno en esta tienda', 403);
        }
      }

      // Verificar que no haya un turno activo EN ESTA TIENDA (no importa el usuario)
      const turnoExistenteEnTienda = await Turno.findOne({
        tienda: tienda,
        estado: 'abierto'
      }).populate('usuario', 'username');

      if (turnoExistenteEnTienda) {
        const usuarioActual = turnoExistenteEnTienda.usuario.username;
        const esPropio = turnoExistenteEnTienda.usuario._id.toString() === req.userId;

        if (esPropio) {
          return errorResponse(res, 'Ya tienes un turno activo en esta tienda. Ciérralo antes de iniciar uno nuevo', 400);
        } else {
          return errorResponse(res, `Ya hay un turno activo en esta tienda abierto por ${usuarioActual}. Debe cerrarse antes de iniciar uno nuevo`, 400);
        }
      }

      // También verificar que el usuario no tenga un turno activo en OTRA tienda
      const turnoExistenteUsuario = await Turno.findOne({
        usuario: req.userId,
        estado: 'abierto'
      }).populate('tienda', 'nombre');

      if (turnoExistenteUsuario) {
        return errorResponse(res, `Ya tienes un turno activo en ${turnoExistenteUsuario.tienda.nombre}. Ciérralo antes de iniciar uno nuevo`, 400);
      }

      // Obtener nombre de la estación (nombre del equipo)
      const estacion = os.hostname() || `Caja-${Date.now()}`;

      // Crear nuevo turno
      const nuevoTurno = new Turno({
        usuario: req.userId,
        tienda,
        estacion,
        efectivoInicial,
        notasApertura: notasApertura || '',
        estado: 'abierto'
      });

      await nuevoTurno.save();

      const turnoPopulado = await Turno.findById(nuevoTurno._id)
        .populate('usuario', 'username')
        .populate('tienda', 'nombre');

      return successResponse(res, {
        message: 'Turno iniciado exitosamente',
        turno: turnoPopulado
      }, 201);

    } catch (error) {
      console.error('Error al iniciar turno:', error);
      return errorResponse(res, 'Error al iniciar el turno', 500);
    }
  }

  /**
   * Cerrar el turno activo
   * Cualquier empleado de la tienda puede cerrar el turno
   */
  async cerrarTurno(req, res) {
    try {
      const { turnoId, efectivoFinal, notasCierre } = req.body;

      // Buscar el turno (sin filtrar por usuario, cualquiera puede cerrar)
      const turno = await Turno.findOne({
        _id: turnoId,
        estado: 'abierto'
      }).populate('tienda', 'nombre');

      if (!turno) {
        return errorResponse(res, 'No se encontró un turno activo para cerrar', 404);
      }

      // Obtener datos del usuario actual para validar permisos
      const User = require('../../core/users/model');
      const usuario = await User.findById(req.userId);

      if (!usuario) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Validar que el usuario tenga permiso para cerrar el turno de esta tienda
      // Admin puede cerrar cualquier turno, empleados solo de su tienda
      if (usuario.role !== 'admin') {
        if (!usuario.tienda) {
          return errorResponse(res, 'Tu usuario no tiene una tienda asignada. Contacta al administrador.', 403);
        }
        if (usuario.tienda.toString() !== turno.tienda._id.toString()) {
          return errorResponse(res, `No puedes cerrar el turno de otra tienda. Tu tienda asignada no coincide con la tienda del turno.`, 403);
        }
      }

      // Validar efectivo final si se proporciona
      if (efectivoFinal !== undefined && efectivoFinal < 0) {
        return errorResponse(res, 'El efectivo final debe ser mayor o igual a 0', 400);
      }

      // Actualizar turno - registrar quién lo cerró
      turno.estado = 'cerrado';
      turno.fechaCierre = new Date();
      turno.efectivoFinal = efectivoFinal || 0;
      turno.notasCierre = notasCierre || '';
      turno.cierreRealizado = true;
      turno.usuarioCierre = req.userId; // Registrar quién cerró el turno

      await turno.save();

      const turnoPopulado = await Turno.findById(turno._id)
        .populate('usuario', 'username')
        .populate('usuarioCierre', 'username')
        .populate('tienda', 'nombre');

      return successResponse(res, {
        message: 'Turno cerrado exitosamente',
        turno: turnoPopulado
      });

    } catch (error) {
      console.error('Error al cerrar turno:', error);
      return errorResponse(res, 'Error al cerrar el turno', 500);
    }
  }

  /**
   * Obtener resumen/estadísticas del turno para el corte
   */
  async getResumenTurno(req, res) {
    try {
      const { turnoId } = req.params;

      const turno = await Turno.findById(turnoId)
        .populate('usuario', 'username')
        .populate('usuarioCierre', 'username')
        .populate('tienda', 'nombre direccion telefono');

      if (!turno) {
        return errorResponse(res, 'Turno no encontrado', 404);
      }

      // Obtener todas las ventas del turno (solo estados completados)
      const ventas = await Sale.find({
        turno: turnoId,
        status: { $in: ['entregado_y_cobrado', 'parcialmente_devuelta'] }
      })
        .populate({
          path: 'items.productId',
          select: 'name category',
          options: { strictPopulate: false } // Permite que continúe si algunos productos no existen
        })
        .populate('cliente', 'nombre')
        .lean(); // Usar lean() para mejor rendimiento

      // Calcular estadísticas
      const stats = this.calcularEstadisticas(ventas || [], turno);

      return successResponse(res, {
        turno,
        ventas: ventas || [],
        stats
      });

    } catch (error) {
      console.error('Error al obtener resumen del turno:', error);
      console.error('Stack:', error.stack);
      return errorResponse(res, 'Error al obtener el resumen del turno', 500);
    }
  }

  /**
   * Calcular estadísticas del turno
   */
  calcularEstadisticas(ventas, turno) {
    const stats = {
      // Totales por forma de pago
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0,

      // Totales generales
      totalVentas: Array.isArray(ventas) ? ventas.length : 0,
      totalMonto: 0,
      totalDescuentos: 0,
      totalImpuestos: 0,

      // Por categoría
      porCategoria: {},

      // Por tipo de servicio
      porTipo: {
        mostrador: { cantidad: 0, monto: 0 },
        recoger: { cantidad: 0, monto: 0 },
        domicilio: { cantidad: 0, monto: 0 }
      },

      // Folios
      folioInicial: null,
      folioFinal: null,

      // Ventas especiales
      ventasNormales: 0,
      ventasCanceladas: 0,
      ventasConDescuento: 0,
      consumoPromedio: 0
    };

    // Validar que ventas sea un array
    if (!Array.isArray(ventas) || ventas.length === 0) {
      // Saldo final con turno vacío
      stats.saldoFinal = turno?.efectivoFinal || 0;
      stats.diferencia = (turno?.efectivoFinal || 0) - (turno?.efectivoInicial || 0);
      return stats;
    }

    ventas.forEach(venta => {
      try {
      // Sumar por forma de pago
      if (venta.paymentType === 'single') {
        if (venta.method === 'efectivo') stats.efectivo += venta.total;
        else if (venta.method === 'transferencia') stats.transferencia += venta.total;
        else if (venta.method === 'tarjeta') stats.tarjeta += venta.total;
      } else if (venta.paymentType === 'mixed' && venta.mixedPayments) {
        venta.mixedPayments.forEach(pago => {
          if (pago.method === 'efectivo') stats.efectivo += pago.amount;
          else if (pago.method === 'transferencia') stats.transferencia += pago.amount;
          else if (pago.method === 'tarjeta') stats.tarjeta += pago.amount;
        });
      }

      // Totales generales
      stats.totalMonto += venta.total;
      stats.totalDescuentos += venta.discount || 0;

      // Por tipo de servicio
      if (venta.type && stats.porTipo[venta.type]) {
        stats.porTipo[venta.type].cantidad++;
        stats.porTipo[venta.type].monto += venta.total;
      }

      // Por categoría (extraer de items)
      if (venta.items && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          const categoria = item.productId?.category || 'Sin categoría';
          if (!stats.porCategoria[categoria]) {
            stats.porCategoria[categoria] = 0;
          }
          stats.porCategoria[categoria] += item.price * item.quantity;
        });
      }

      // Folios
      if (venta.folio) {
        if (stats.folioInicial === null || venta.folio < stats.folioInicial) {
          stats.folioInicial = venta.folio;
        }
        if (stats.folioFinal === null || venta.folio > stats.folioFinal) {
          stats.folioFinal = venta.folio;
        }
      }

      // Clasificar ventas
      if (venta.status === 'cancelada') {
        stats.ventasCanceladas++;
      } else {
        stats.ventasNormales++;
      }

      if (venta.discount > 0) {
        stats.ventasConDescuento++;
      }
      } catch (error) {
        console.error('Error procesando venta en estadísticas:', error);
        // Continuar con la siguiente venta
      }
    });

    // Consumo promedio
    if (stats.ventasNormales > 0) {
      stats.consumoPromedio = stats.totalMonto / stats.ventasNormales;
    }

    // Saldo final
    stats.saldoFinal = turno.efectivoFinal || 0;
    stats.diferencia = (turno.efectivoFinal || 0) - turno.efectivoInicial - stats.efectivo;

    return stats;
  }

  /**
   * Obtener historial de turnos
   */
  async getHistorial(req, res) {
    try {
      const { page = 1, limit = 10, tienda, fechaInicio, fechaFin } = req.query;

      const query = {};

      // ⭐ ACTUALIZADO: Diferentes lógicas según el rol
      if (req.userRole === 'admin') {
        // Admin puede ver todos los turnos
        if (tienda) {
          query.tienda = tienda;
        }
      } else if (req.userRole === 'vendedor') {
        // Vendedor ve todos los turnos de su tienda asignada
        const usuario = await User.findById(req.userId);

        if (!usuario) {
          return errorResponse(res, 'Usuario no encontrado', 404);
        }

        if (!usuario.tienda) {
          return errorResponse(res, 'El usuario no tiene una tienda asignada', 403);
        }

        // Vendedor ve todos los turnos de su tienda (puede cerrar turnos de otros)
        query.tienda = usuario.tienda;

        // Si se especifica una tienda diferente, no tiene permiso
        if (tienda && tienda !== usuario.tienda.toString()) {
          return errorResponse(res, 'No tienes permiso para ver turnos de otras tiendas', 403);
        }
      } else {
        // Repartidor u otros roles solo ven sus propios turnos
        query.usuario = req.userId;
      }

      if (fechaInicio || fechaFin) {
        query.fechaApertura = {};

        // Fecha inicio: establecer al inicio del día (00:00:00)
        if (fechaInicio) {
          const fechaInicioDate = new Date(fechaInicio);
          fechaInicioDate.setUTCHours(0, 0, 0, 0);
          query.fechaApertura.$gte = fechaInicioDate;
        }

        // Fecha fin: establecer al final del día (23:59:59.999)
        if (fechaFin) {
          const fechaFinDate = new Date(fechaFin);
          fechaFinDate.setUTCHours(23, 59, 59, 999);
          query.fechaApertura.$lte = fechaFinDate;
        }
      }

      const turnos = await Turno.find(query)
        .populate('usuario', 'username')
        .populate('tienda', 'nombre')
        .sort({ fechaApertura: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Turno.countDocuments(query);

      return successResponse(res, {
        turnos,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });

    } catch (error) {
      console.error('Error al obtener historial de turnos:', error);
      return errorResponse(res, 'Error al obtener el historial', 500);
    }
  }
}

module.exports = new TurnoController();
