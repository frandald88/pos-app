const Sale = require('../../core/sales/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class ReportesController {
  // Reporte de ventas detallado
  async getVentasReport(req, res) {
    try {
      const { tipoVenta, inicio, fin, tipo, tiendaId, limit = 1000 } = req.query;

      if (!inicio || !fin) {
        return errorResponse(res, 'Los parámetros "inicio" y "fin" son requeridos en formato YYYY-MM-DD', 400);
      }

      let startDate, endDate;

        // Soporta inicio=today
        if (inicio.toLowerCase() === 'today') {
          const today = new Date();
          startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        } else {
          startDate = new Date(inicio + 'T00:00:00.000Z');
        }

        // Soporta fin=today
        if (fin.toLowerCase() === 'today') {
          endDate = new Date(); // Fecha y hora actual
        } else {
          endDate = new Date(fin + 'T23:59:59.999Z');
        }

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return errorResponse(res, 'Formato de fecha inválido. Use YYYY-MM-DD o "today"', 400);
        }

      if (startDate > endDate) {
        return errorResponse(res, 'La fecha de inicio debe ser anterior a la fecha de fin', 400);
      }

      const filtro = {
        date: { $gte: startDate, $lte: endDate },
      };

      if (tipoVenta && ['efectivo', 'transferencia', 'tarjeta'].includes(tipoVenta)) {
        filtro.method = tipoVenta;
      }
      if (tipo && ['mostrador', 'recoger', 'domicilio'].includes(tipo)) {
        filtro.type = tipo;
      }
      if (tiendaId) {
        filtro.tienda = tiendaId;
      }

      const ventas = await Sale.find(filtro)
        .populate("user", "username")
        .populate("deliveryPerson", "username")
        .populate("cliente", "nombre")
        .populate("items.productId", "sku")
        .populate("tienda", "nombre")
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .lean();

      const taxRate = 0.10;
      const resultados = [];
      let totalVentasGenerales = 0;
      let totalDescuentosGenerales = 0;

      ventas.forEach((venta) => {
        const descuentoTotal = venta.discount || 0;
        const totalSinDescuento = venta.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        totalVentasGenerales += venta.total;
        totalDescuentosGenerales += descuentoTotal;

        venta.items.forEach((item) => {
          const precioBruto = item.price * item.quantity;
          const proporcionDescuento = totalSinDescuento > 0 ? (precioBruto / totalSinDescuento) : 0;
          const descuentoProducto = proporcionDescuento * descuentoTotal;
          const precioTotalConDescuento = precioBruto - descuentoProducto;
          const precioUnitarioConDescuento = precioTotalConDescuento / item.quantity;
          const precioSinIVA = precioUnitarioConDescuento / (1 + taxRate);
          const ivaUnitario = precioUnitarioConDescuento - precioSinIVA;
          const subtotal = precioSinIVA * item.quantity;
          const ivaTotalProducto = ivaUnitario * item.quantity;
          const porcentajeDescuento = totalSinDescuento > 0 ? (descuentoProducto / precioBruto) * 100 : 0;

          resultados.push({
            _id: venta._id,
            ventaId: venta._id,
            date: venta.date,
            user: venta.user?.username || "-",
            method: venta.method,
            type: venta.type,
            status: venta.status || "completada",
            producto: item.name || "Sin nombre",
            sku: item.productId?.sku || "-",
            cantidad: item.quantity,
            precioUnitarioOriginal: item.price,
            precioUnitario: Number(precioUnitarioConDescuento.toFixed(2)),
            subtotal: Number(subtotal.toFixed(2)),
            ivaProducto: Number(ivaTotalProducto.toFixed(2)),
            totalProducto: Number((subtotal + ivaTotalProducto).toFixed(2)),
            totalVenta: Number(venta.total.toFixed(2)),
            descuento: Number(descuentoProducto.toFixed(2)),
            porcentajeDescuento: Number(porcentajeDescuento.toFixed(2)),
            repartidor: venta.deliveryPerson?.username || "-",
            tienda: venta.tienda?.nombre || "-",
            cliente: venta.cliente?.nombre || "-",
            nota: item.note || ""
          });
        });
      });

      const resumen = {
        totalRegistros: resultados.length,
        totalVentas: ventas.length,
        totalVentasGenerales: Number(totalVentasGenerales.toFixed(2)),
        totalDescuentosGenerales: Number(totalDescuentosGenerales.toFixed(2)),
        ventasPorMetodo: {},
        ventasPorTipo: {},
        ventasPorTienda: {}
      };

      ventas.forEach(venta => {
        resumen.ventasPorMetodo[venta.method] = (resumen.ventasPorMetodo[venta.method] || 0) + venta.total;
        resumen.ventasPorTipo[venta.type] = (resumen.ventasPorTipo[venta.type] || 0) + venta.total;
        const tiendaNombre = venta.tienda?.nombre || 'Sin tienda';
        resumen.ventasPorTienda[tiendaNombre] = (resumen.ventasPorTienda[tiendaNombre] || 0) + venta.total;
      });

      return successResponse(res, {
        resultados,
        resumen,
        filtros: { inicio, fin, tipoVenta, tipo, tiendaId }
      }, 'Reporte de ventas generado exitosamente');
    } catch (err) {
  console.error("Error al generar reporte de ventas:", err);
  return res.status(500).json({
    message: 'Error al generar reporte de ventas',
    error: err.message || err
  });
}
  }

  // Reporte de productos más vendidos
  async getTopProducts(req, res) {
    try {
      const { inicio, fin, tiendaId, limit = 20 } = req.query;

      if (!inicio || !fin) {
        return errorResponse(res, 'Los parámetros "inicio" y "fin" son requeridos', 400);
      }

      const startDate = new Date(inicio + 'T00:00:00.000Z');
      const endDate = new Date(fin + 'T23:59:59.999Z');

      const matchFilter = {
        date: { $gte: startDate, $lte: endDate }
      };

      if (tiendaId) {
        matchFilter.tienda = mongoose.Types.ObjectId(tiendaId);
      }

      const pipeline = [
        { $match: matchFilter },
        { $unwind: "$items" },
        {
          $group: {
            _id: {
              nombre: "$items.name",
              sku: "$items.productId"
            },
            cantidadVendida: { $sum: "$items.quantity" },
            ingresoTotal: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
            numeroVentas: { $sum: 1 }
          }
        },
        { $sort: { cantidadVendida: -1 } },
        { $limit: parseInt(limit) }
      ];

      const productos = await Sale.aggregate(pipeline);

      const productosFormateados = productos.map(item => ({
        nombre: item._id.nombre,
        sku: item._id.sku || "Sin SKU",
        cantidadVendida: item.cantidadVendida,
        ingresoTotal: Number(item.ingresoTotal.toFixed(2)),
        numeroVentas: item.numeroVentas,
        promedioVenta: Number((item.ingresoTotal / item.numeroVentas).toFixed(2))
      }));

      return successResponse(res, {
        productos: productosFormateados,
        periodo: { inicio, fin },
        tiendaId: tiendaId || "todas"
      }, 'Reporte de productos generado exitosamente');
    } catch (err) {
      console.error("Error al generar reporte de productos:", err);
      return errorResponse(res, 'Error al generar reporte de productos', 500);
    }
  }

  // Reporte de performance de usuarios
  async getUsersPerformance(req, res) {
    try {
      const { inicio, fin, tiendaId } = req.query;

      if (!inicio || !fin) {
        return errorResponse(res, 'Los parámetros "inicio" y "fin" son requeridos', 400);
      }

      const startDate = new Date(inicio + 'T00:00:00.000Z');
      const endDate = new Date(fin + 'T23:59:59.999Z');

      const matchFilter = {
        date: { $gte: startDate, $lte: endDate }
      };

      if (tiendaId) {
        matchFilter.tienda = mongoose.Types.ObjectId(tiendaId);
      }

      const pipeline = [
        { $match: matchFilter },
        {
          $group: {
            _id: "$user",
            totalVentas: { $sum: "$total" },
            cantidadVentas: { $sum: 1 },
            totalDescuentos: { $sum: "$discount" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "usuario"
          }
        },
        { $unwind: "$usuario" },
        {
          $project: {
            username: "$usuario.username",
            totalVentas: 1,
            cantidadVentas: 1,
            totalDescuentos: 1,
            promedioVenta: { $divide: ["$totalVentas", "$cantidadVentas"] }
          }
        },
        { $sort: { totalVentas: -1 } }
      ];

      const usuarios = await Sale.aggregate(pipeline);

      const usuariosFormateados = usuarios.map(item => ({
        username: item.username,
        totalVentas: Number(item.totalVentas.toFixed(2)),
        cantidadVentas: item.cantidadVentas,
        totalDescuentos: Number(item.totalDescuentos.toFixed(2)),
        promedioVenta: Number(item.promedioVenta.toFixed(2))
      }));

      return successResponse(res, {
        usuarios: usuariosFormateados,
        periodo: { inicio, fin }
      }, 'Reporte de usuarios generado exitosamente');
    } catch (err) {
      console.error("Error al generar reporte de usuarios:", err);
      return errorResponse(res, 'Error al generar reporte de usuarios', 500);
    }
  }
}

module.exports = new ReportesController();