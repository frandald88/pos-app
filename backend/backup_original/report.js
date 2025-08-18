const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const Sale = require("../models/Sale");

router.get("/ventas", verifyToken, async (req, res) => {
  try {
    const { tipoVenta, inicio, fin, tipo, tiendaId } = req.query;

    const filtro = {
      date: {
        $gte: new Date(inicio),
        $lte: new Date(fin),
      },
    };

    if (tipoVenta) filtro.method = tipoVenta;
    if (tipo) filtro.type = tipo;
    if (tiendaId) filtro.tienda = tiendaId;

    const ventas = await Sale.find(filtro)
      .populate("user", "username")
      .populate("deliveryPerson", "username")
      .populate("cliente", "nombre")
      .populate("items.productId", "sku") // Para traer el SKU
      .populate("tienda", "nombre")
      .lean();

    const taxRate = 0.10;
    const resultados = [];

    ventas.forEach((venta) => {
      const descuentoTotal = venta.discount || 0;
      const totalSinDescuento = venta.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      venta.items.forEach((item) => {
        const precioBruto = item.price * item.quantity;

        // Proporción de descuento por producto
        const proporcionDescuento = totalSinDescuento > 0 ? (precioBruto / totalSinDescuento) : 0;
        const descuentoProducto = proporcionDescuento * descuentoTotal;

        // Precio neto unitario después del descuento
        const precioTotalConDescuento = precioBruto - descuentoProducto;
        const precioUnitarioConDescuento = precioTotalConDescuento / item.quantity;

        // Calculo del IVA y subtotal
        const precioSinIVA = precioUnitarioConDescuento / (1 + taxRate);
        const ivaUnitario = precioUnitarioConDescuento - precioSinIVA;

        const subtotal = precioSinIVA * item.quantity;
        const ivaTotalProducto = ivaUnitario * item.quantity;

        const porcentajeDescuento = totalSinDescuento > 0 ? (descuentoProducto / precioBruto) * 100 : 0;

        resultados.push({
          _id: venta._id, // Esto lo usarán tus checkboxes
          ventaId: venta._id, // Si quieres, puedes seguir mostrando esto como "Id de Venta" en pantalla
          date: venta.date,
          user: venta.user?.username || "-",
          method: venta.method,
          type: venta.type,
          producto: item.name,
          sku: item.productId?.sku || "-",
          cantidad: item.quantity,
          precioUnitario: precioUnitarioConDescuento,
          subtotal: subtotal,
          ivaProducto: ivaTotalProducto,
          totalProducto: subtotal + ivaTotalProducto,
          totalVenta: Number(venta.total.toFixed(2)),
          descuento: Number(descuentoProducto.toFixed(2)),
          porcentajeDescuento: Number(porcentajeDescuento.toFixed(2)),
          repartidor: venta.deliveryPerson?.username || "-",
          tienda: venta.tienda?.nombre || "-",
          cliente: venta.cliente?.nombre || "-",
        });
      });
    });

    res.json(resultados);
  } catch (err) {
    console.error("Error al generar reporte:", err);
    res.status(500).json({ message: "Error al generar reporte" });
  }
});

module.exports = router;
