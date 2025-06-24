const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, async (req, res) => {
  try {
    const { products, method, type, deliveryPerson } = req.body;

    if (!products || !products.length) {
      return res.status(400).json({ message: 'Productos no válidos' });
    }

    if (!['efectivo', 'transferencia', 'tarjeta'].includes(method)) {
      return res.status(400).json({ message: 'Método de pago inválido' });
    }

    if (!['mostrador', 'recoger', 'domicilio'].includes(type)) {
      return res.status(400).json({ message: 'Tipo de venta inválido' });
    }

    if (type === 'domicilio' && !deliveryPerson) {
      return res.status(400).json({ message: 'Debe asignar un repartidor para domicilio' });
    }

    const items = products.map(p => ({
      productId: p._id,
      quantity: p.qty,
      price: p.price,
      name: p.name,
    }));

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const sale = new Sale({
      items,
      total,
      method,
      type,
      user: req.userId,
      deliveryPerson: type === 'domicilio' ? deliveryPerson : null
    });

    await sale.save();

    // Actualizar stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    res.status(201).json({ message: 'Venta registrada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar venta', error: error.message });
  }
});

module.exports = router;