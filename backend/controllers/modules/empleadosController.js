const empleadosRoutes = require('../../modules/empleados/routes');

class EmpleadosController {
  // Este controlador simplemente expone las rutas del módulo de empleados
  // Toda la lógica de negocio está en el módulo correspondiente
  getRoutes() {
    return empleadosRoutes;
  }
}

module.exports = new EmpleadosController();