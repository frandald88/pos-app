const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, async (req, res) => {
  const { saleId, returnedItems, refundAmount } = req.body;

  try {
    const sale = await Sale.findById(saleId);
    if (!sale) return res.status(404).json({ message: 'Venta no encontrada' });

    for (const item of returnedItems) {
      // ✅ Sumar stock de productos devueltos
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
      }
    }

    // ✅ Actualizar el total de devoluciones acumuladas en la venta
    sale.totalReturned += refundAmount;
    await sale.save();

    // ✅ Registrar devolución
    const returnRecord = new Return({
      saleId,
      returnedItems,
      refundAmount,
      processedBy: req.userId
    });

    await returnRecord.save();

    res.status(201).json({ message: 'Devolución registrada correctamente' });
  } catch (error) {
  if (error.message.includes('tienda') && error.message.includes('required')) {
    return res.status(400).json({
      message: 'No se puede devolver una venta que no tiene tienda asignada. Contacte a un administrador.',
    });
  }
  console.error('Error al crear devolución:', error);
  res.status(500).json({ message: 'Error interno al crear la devolución.' });
}
});


router.get('/', verifyToken, async (req, res) => {
  try {
    const returns = await Return.find()
      .populate('saleId', 'total date')  // ✅ Opcional: Info de la venta original
      .populate('processedBy', 'username')
      .sort({ date: -1 });

    res.json(returns);
  } catch (error) {
    console.error('Error obteniendo devoluciones:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
});



module.exports = router;
