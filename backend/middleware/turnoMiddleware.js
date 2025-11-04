const Turno = require('../core/turnos/model');
const { errorResponse } = require('../shared/utils/responseHelper');

/**
 * Middleware para verificar que haya un turno activo en la tienda
 * Debe ser usado después del middleware de autenticación (verifyToken)
 *
 * LÓGICA:
 * - Si la petición incluye tienda en el body, valida que esa tienda tenga turno activo
 * - Si el usuario tiene tienda asignada, valida que su tienda tenga turno activo
 * - Si es admin sin tienda y sin tienda en body, busca su propio turno activo
 */
async function verificarTurnoActivo(req, res, next) {
  try {
    const User = require('../core/users/model');
    const usuario = await User.findById(req.userId);

    if (!usuario) {
      return errorResponse(res, 'Usuario no encontrado', 404);
    }

    let turnoActivo;
    let tiendaAValidar;

    // 1. Si la petición tiene tienda en el body (ej: al crear una venta), usar esa tienda
    if (req.body.tienda) {
      tiendaAValidar = req.body.tienda;
    }
    // 2. Si el usuario tiene tienda asignada, usar esa tienda
    else if (usuario.tienda) {
      tiendaAValidar = usuario.tienda;
    }

    // Si hay una tienda para validar, buscar turno de esa tienda
    if (tiendaAValidar) {
      turnoActivo = await Turno.findOne({
        tienda: tiendaAValidar,
        estado: 'abierto'
      }).populate('tienda', 'nombre');
    } else {
      // Si es admin sin tienda asignada y sin tienda en body, buscar su propio turno activo
      turnoActivo = await Turno.findOne({
        usuario: req.userId,
        estado: 'abierto'
      }).populate('tienda', 'nombre');
    }

    if (!turnoActivo) {
      return errorResponse(
        res,
        'No tienes un turno activo. Debes iniciar un turno antes de realizar ventas.',
        403
      );
    }

    // Adjuntar el turno al request para usarlo en el controlador
    req.turnoActivo = turnoActivo;

    next();
  } catch (error) {
    console.error('Error al verificar turno activo:', error);
    return errorResponse(res, 'Error al verificar el turno', 500);
  }
}

/**
 * Middleware opcional para verificar turno activo
 * No bloquea la petición si no hay turno, solo adjunta el turno si existe
 */
async function verificarTurnoActivoOpcional(req, res, next) {
  try {
    const turnoActivo = await Turno.findOne({
      usuario: req.userId,
      estado: 'abierto'
    });

    // Adjuntar el turno si existe, o null si no hay turno activo
    req.turnoActivo = turnoActivo || null;

    next();
  } catch (error) {
    console.error('Error al verificar turno activo (opcional):', error);
    // No bloquear la petición, solo continuar sin turno
    req.turnoActivo = null;
    next();
  }
}

module.exports = {
  verificarTurnoActivo,
  verificarTurnoActivoOpcional
};
