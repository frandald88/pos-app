const gastosRoutes = require('../../modules/gastos/routes');

class GastosController {
  // Este controlador simplemente expone las rutas del módulo de gastos
  // Toda la lógica de negocio está en el módulo correspondiente
  getRoutes() {
    return gastosRoutes;
  }
}

module.exports = new GastosController();