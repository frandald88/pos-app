const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const PDFDocument = require('pdfkit');
const Tienda = require('../models/Tienda');
const Cliente = require('../models/Cliente');
const mongoose = require('mongoose');

router.post('/', verifyToken, async (req, res) => {
  try {
    console.log("Body recibido:", req.body);
    const { products, method, saleType, deliveryPerson, discount } = req.body;  

    if (!products || !products.length) {
      return res.status(400).json({ message: 'Productos no válidos' });
    }

    if (!['efectivo', 'transferencia', 'tarjeta'].includes(method)) {
      return res.status(400).json({ message: 'Método de pago inválido' });
    }

    if (!['mostrador', 'recoger', 'domicilio'].includes(saleType)) {
      return res.status(400).json({ message: 'Tipo de venta inválido' });
    }

    if (saleType === 'domicilio' && !deliveryPerson) {
      return res.status(400).json({ message: 'Debe asignar un repartidor para domicilio' });
    }

        const items = products.map(p => {
          const isValidObjectId = mongoose.Types.ObjectId.isValid(p._id);
            return {
              productId: isValidObjectId ? p._id : null,
              quantity: p.qty,
              price: p.price,
              name: p.name,
              sku: p.sku || "",
              note: p.note || "",  // ✅ Incluyendo la nota aquí
            };
          });

      const totalBruto = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const descuento = req.body.discount || 0;
      const total = totalBruto - descuento;

      const sale = new Sale({
        items,
        total,
        method,
        type: saleType,
        user: req.userId,
        cliente: req.body.clienteId || null,
        tienda: req.body.tienda,                    // ✅ Aquí lo importante
        deliveryPerson: saleType === 'domicilio' ? deliveryPerson : null,
        discount: descuento
      });

    await sale.save();

    // Actualizar stock
    for (const item of items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }
      }

    res.status(201).json({ message: 'Venta registrada' });
  } catch (error) {
    console.error('Error al registrar venta:', error);
    res.status(500).json({ message: 'Error al registrar venta', error: error.message });
  }
});


// Actualizar estado de la venta
router.patch('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Validación: Solo permitir cancelar si está en preparación o listo para envío
    if (status === "cancelada") {
      if (sale.status !== "en_preparacion" && sale.status !== "listo_para_envio") {
        return res.status(400).json({ message: 'Solo puedes cancelar pedidos en preparación o listos para envío' });
      }

      // Devolver stock solo si la venta tiene productos con productId válido
      for (const item of sale.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
        }
      }
    }

    // Actualizar el estado
    sale.status = status;
    await sale.save();

    res.json({ message: 'Estado actualizado', sale });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
});

// Obtener ventas por estado
router.get('/', verifyToken, async (req, res) => {
  const { status } = req.query;

  try {
    const filter = status ? { status } : {};
    const sales = await Sale.find(filter)
      .populate('cliente', 'nombre telefono')
      .populate('tienda', 'nombre')
      .populate('deliveryPerson', 'username')
      .sort({ date: -1 });

    res.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cliente', 'nombre telefono')
      .populate('tienda', 'nombre')
      .populate('deliveryPerson', 'username');

    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error buscando venta por ID:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
});

router.delete('/no-store', verifyToken, requireAdmin, async (req, res) => {
  try {
    const result = await Sale.deleteMany({ tienda: { $exists: false } });
    res.json({ message: `Ventas eliminadas: ${result.deletedCount}` });
  } catch (error) {
    console.error('Error al eliminar ventas sin tienda:', error);
    res.status(500).json({ message: 'Error interno al eliminar ventas sin tienda.' });
  }
});

router.post('/delete-multiple', verifyToken, requireAdmin, async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'Debe enviar un array de IDs de ventas a eliminar.' });
  }

  try {
    const result = await Sale.deleteMany({ _id: { $in: ids } });
    res.json({ message: `Ventas eliminadas: ${result.deletedCount}` });
  } catch (error) {
    console.error('Error al eliminar múltiples ventas:', error);
    res.status(500).json({ message: 'Error interno al eliminar ventas.' });
  }
});

router.post('/quote', async (req, res) => {
  const { products, clienteId, tienda, discount = 0 } = req.body;

  // ✅ Validación: No permitir cotización sin productos
  if (!products || !products.length) {
    return res.status(400).json({ error: 'No hay productos en la cotización' });
  }

  try {
    const tiendaData = await Tienda.findById(tienda).lean();
    const tiendaNombre = tiendaData ? tiendaData.nombre : tienda;

    const clienteData = clienteId ? await Cliente.findById(clienteId).lean() : null;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cotizacion.pdf');
    doc.pipe(res);

    // ✅ Encabezado
    doc.fontSize(20).text('COTIZACIÓN', { align: 'center', underline: true });
    doc.moveDown();

    const today = new Date();
    doc.fontSize(12).text(`Fecha: ${today.toLocaleDateString('es-MX')} ${today.toLocaleTimeString('es-MX')}`);
    doc.text(`Tienda: ${tiendaNombre}`);
    if (clienteData) doc.text(`Cliente: ${clienteData.nombre} - ${clienteData.telefono}`);
    doc.moveDown();

    // ✅ Lista de productos
    let subtotal = 0;
    doc.fontSize(12).text('Detalle de productos:', { underline: true });
    products.forEach(p => {
      const lineTotal = p.price * p.qty;
      subtotal += lineTotal;
      doc.text(`- ${p.name} x${p.qty} @ $${p.price.toFixed(2)} c/u = $${lineTotal.toFixed(2)}`);
    });

    const discountAmount = subtotal * (discount / 100);
    const subtotalWithDiscount = subtotal - discountAmount;
    const baseSubtotal = subtotalWithDiscount / 1.1;  // IVA asumido 10%
    const tax = subtotalWithDiscount - baseSubtotal;
    const totalWithTax = subtotalWithDiscount;

    doc.moveDown();
    doc.fontSize(12).text('--- Totales ---', { bold: true });
    doc.text(`Subtotal sin descuento: $${subtotal.toFixed(2)}`);
    doc.text(`Descuento: -$${discountAmount.toFixed(2)} (${discount}%)`);
    doc.text(`Subtotal sin IVA: $${baseSubtotal.toFixed(2)}`);
    doc.text(`IVA incluido: $${tax.toFixed(2)}`);
    doc.fontSize(14).text(`Total: $${totalWithTax.toFixed(2)}`, { bold: true });

    doc.end();
  } catch (err) {
    console.error('Error generando cotización:', err);
    res.status(500).json({ error: 'Error al generar cotización' });
  }
});

module.exports = router;
