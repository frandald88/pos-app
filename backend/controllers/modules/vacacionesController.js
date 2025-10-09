const vacacionesRoutes = require('../../modules/vacaciones/routes');

class VacacionesController {
  getRoutes() {
    return vacacionesRoutes;
  }
}

module.exports = new VacacionesController();