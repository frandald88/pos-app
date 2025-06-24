const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware"); 
const Sale = require("../models/sale");
const User = require("../models/User");

router.get("/ventas", verifyToken, async (req, res) => {
  try {
        const { tipoVenta, inicio, fin, tipo } = req.query;

        const filtro = {
             date: {
              $gte: new Date(inicio),
              $lte: new Date(fin),
            },
        };

        if (tipoVenta) {
            filtro.method = tipoVenta;
        }

        if (tipo) {
            filtro.type = tipo; // Aquí se filtra por tipo de venta
            }

    const ventas = await Sale.find(filtro)
      .populate("user", "username")
      .populate("deliveryPerson", "username")
      .populate("cliente", "nombre") // si tienes un modelo de cliente
      .lean();

    const taxRate = 0.10;

    const resultados = ventas.map((venta) => {
      let ivaTotal = 0;
      const productos = venta.items.map((item) => {
        const precioSinIVA = item.price / (1 + taxRate);
        const ivaProducto = item.price - precioSinIVA;
        const subtotal = item.price * item.quantity;

        ivaTotal += ivaProducto * item.quantity;

        return {
          nombre: item.name,
          cantidad: item.quantity,
          precioUnitario: item.price,
          subtotal,
          iva: ivaProducto * item.quantity,
        };
      });

      return {
          _id: venta._id,
          date: venta.date,
          user: venta.user,
          method: venta.method,
          type: venta.type, // ✅ Aquí está la solución
          productos,
          ivaTotal,
          total: venta.total,
          repartidor: venta.deliveryPerson || null,
          cliente: venta.cliente || null,
      };
    });

    res.json(resultados);
  } catch (err) {
    console.error("Error al generar reporte:", err);
    res.status(500).json({ message: "Error al generar reporte" });
  }
});

module.exports = router;
