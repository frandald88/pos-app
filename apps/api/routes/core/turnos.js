const express = require('express');
const router = express.Router();
const turnoController = require('../../controllers/core/turnosController');
const { verifyToken, requireRoles } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { cerrarTurnosAutomaticamente } = require('../../core/turnos/autoClose');

// Todas las rutas requieren autenticación y tenant
router.use(verifyToken);
router.use(identifyTenant);
router.use(requireTenant);

/**
 * @route   GET /api/turnos/tiendas-disponibles
 * @desc    Obtener tiendas disponibles según el rol del usuario
 * @access  Private
 */
router.get('/tiendas-disponibles', turnoController.getTiendasDisponibles);

/**
 * @route   GET /api/turnos/activo
 * @desc    Obtener el turno activo del usuario actual
 * @access  Private
 */
router.get('/activo', turnoController.getTurnoActivo);

/**
 * @route   POST /api/turnos/iniciar
 * @desc    Iniciar un nuevo turno
 * @access  Private
 */
router.post('/iniciar', turnoController.iniciarTurno);

/**
 * @route   POST /api/turnos/cerrar
 * @desc    Cerrar el turno activo
 * @access  Private
 */
router.post('/cerrar', turnoController.cerrarTurno);

/**
 * @route   GET /api/turnos/:turnoId/resumen
 * @desc    Obtener resumen/estadísticas del turno para el corte
 * @access  Private (admin, vendedor)
 */
router.get('/:turnoId/resumen', requireRoles(['admin', 'vendedor']), turnoController.getResumenTurno);

/**
 * @route   GET /api/turnos/historial
 * @desc    Obtener historial de turnos (con paginación y filtros)
 * @access  Private
 */
router.get('/historial', turnoController.getHistorial);

/**
 * @route   POST /api/turnos/cerrar-automaticos
 * @desc    Ejecutar manualmente el cierre automático de turnos (solo para testing)
 * @access  Private
 */
router.post('/cerrar-automaticos', async (req, res) => {
  try {
    const resultado = await cerrarTurnosAutomaticamente();
    res.json({
      success: true,
      message: 'Cierre automático ejecutado',
      data: resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar cierre automático',
      error: error.message
    });
  }
});

module.exports = router;
