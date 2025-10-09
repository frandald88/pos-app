const deliveryRoutes = require('../../modules/delivery/routes');

class DeliveryController {
  getRoutes() {
    return deliveryRoutes;
  }
}

module.exports = new DeliveryController();
