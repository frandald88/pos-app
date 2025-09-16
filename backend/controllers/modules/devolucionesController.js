const devolucionesRoutes = require('../../modules/devoluciones/routes');

class DevolucionesController {
  // Este controlador simplemente expone las rutas del módulo de devoluciones
  // Toda la lógica de negocio está en el módulo correspondiente
  getRoutes() {
    return devolucionesRoutes;
  }
}

module.exports = new DevolucionesController();