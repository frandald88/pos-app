const deliveryRoutes = require('../../core/delivery/routes');

class DeliveryController {
  getRoutes() {
    return deliveryRoutes;
  }
}

module.exports = new DeliveryController();
