const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../../shared/middleware/authMiddleware");
const Sale = require("../../core/sales/model");
const { errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require("mongoose");

// ✅ CORREGIDO: Reporte de ventas detallado
router.get("/ventas", verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log("Parámetros recibidos:", req.query);
    const { tipoVenta, inicio, fin, tipo, tiendaId, categoria, limit = 1000 } = req.query;
    
    if (!inicio || !fin) {
      return res.status(400).json({
        message: 'Los parámetros "inicio" y "fin" son requeridos'
      });
    }

    let startDate, endDate;

    // Manejo mejorado de fechas
    if (inicio.toLowerCase() === 'today') {
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    } else {
      // Si viene con hora (datetime-local), usar tal como viene
      if (inicio.includes('T')) {
        startDate = new Date(inicio);
      } else {
        // Si solo viene fecha, agregar hora inicio del día
        startDate = new Date(inicio + 'T00:00:00.000');
      }
      
      if (fin.includes('T')) {
        endDate = new Date(fin);
      } else {
        // Si solo viene fecha, agregar hora fin del día
        endDate = new Date(fin + 'T23:59:59.999');
      }
    }

    // Validar fechas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        message: 'Formato de fecha inválido'
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({ 
        message: "La fecha de inicio debe ser anterior a la fecha de fin" 
      });
    }

    console.log("Rango de fechas:", {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const filtro = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
      // ✅ MEJORADO: Incluir ventas entregadas, canceladas y parcialmente devueltas en reportes
      status: { $in: ['entregado_y_cobrado', 'cancelada', 'parcialmente_devuelta'] }
    };


      // ✅ MEJORADO: Filtro por método incluyendo pagos mixtos desglosados
      if (tipoVenta && ['efectivo', 'transferencia', 'tarjeta'].includes(tipoVenta)) {
        // Para ventas mixtas, verificar si existe el método en mixedPayments
        filtro.$or = [
          { method: tipoVenta }, // Pagos únicos
          { 
            paymentType: 'mixed',
            'mixedPayments.method': tipoVenta 
          } // Pagos mixtos que contengan este método
        ];
      }
    
    if (tipo && ['mostrador', 'recoger', 'domicilio'].includes(tipo)) {
      filtro.type = tipo;
    }
    
    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      filtro.tienda = new mongoose.Types.ObjectId(tiendaId);
    }

    console.log("Filtro aplicado:", JSON.stringify(filtro, null, 2));

    // ✅ NUEVO: Si se filtra por categoría, usar agregación para filtrar productos por categoría
    let ventas;
    if (categoria && categoria.trim() !== '') {
      console.log("Aplicando filtro de categoría:", categoria);
      
      ventas = await Sale.aggregate([
        { $match: filtro },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        { $match: { "productInfo.category": categoria } },
        {
          $group: {
            _id: "$_id",
            date: { $first: "$date" },
            total: { $first: "$total" },
            discount: { $first: "$discount" },
            method: { $first: "$method" },
            paymentType: { $first: "$paymentType" },
            mixedPayments: { $first: "$mixedPayments" },
            type: { $first: "$type" },
            status: { $first: "$status" },
            totalReturned: { $first: "$totalReturned" },
            user: { $first: "$user" },
            deliveryPerson: { $first: "$deliveryPerson" },
            cliente: { $first: "$cliente" },
            tienda: { $first: "$tienda" },
            items: { $push: "$items" },
            productInfo: { $push: { $arrayElemAt: ["$productInfo", 0] } }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
            pipeline: [{ $project: { username: 1 } }]
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "deliveryPerson",
            foreignField: "_id",
            as: "deliveryPerson",
            pipeline: [{ $project: { username: 1 } }]
          }
        },
        {
          $lookup: {
            from: "clientes",
            localField: "cliente",
            foreignField: "_id",
            as: "cliente",
            pipeline: [{ $project: { nombre: 1 } }]
          }
        },
        {
          $lookup: {
            from: "tiendas",
            localField: "tienda",
            foreignField: "_id",
            as: "tienda",
            pipeline: [{ $project: { nombre: 1 } }]
          }
        },
        {
          $addFields: {
            user: { $arrayElemAt: ["$user", 0] },
            deliveryPerson: { $arrayElemAt: ["$deliveryPerson", 0] },
            cliente: { $arrayElemAt: ["$cliente", 0] },
            tienda: { $arrayElemAt: ["$tienda", 0] }
          }
        },
        { $sort: { date: -1 } },
        { $limit: parseInt(limit) }
      ]);
    } else {
      // Consulta normal sin filtro de categoría
      ventas = await Sale.find(filtro)
        .populate("user", "username")
        .populate("deliveryPerson", "username")
        .populate("cliente", "nombre")
        .populate("items.productId", "sku category")
        .populate("tienda", "nombre")
        .sort({ date: -1 })
        .limit(parseInt(limit))
        .lean();
    }

    console.log(`Ventas encontradas: ${ventas.length}`);
    if (ventas.length > 0) {
      console.log('DEBUG - Primera venta encontrada:', JSON.stringify({
        _id: ventas[0]._id,
        status: ventas[0].status,
        total: ventas[0].total,
        totalReturned: ventas[0].totalReturned,
        date: ventas[0].date
      }, null, 2));
    }

    const taxRate = 0.10; // 10% IVA
    const resultados = [];
    let totalVentasGenerales = 0;
    let totalDescuentosGenerales = 0;

    ventas.forEach((venta) => {
      const descuentoTotal = venta.discount || 0;
      const totalSinDescuento = venta.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // ✅ NUEVO: Para ventas parcialmente devueltas, usar el total neto (total - devoluciones)
      const totalNeto = venta.total - (venta.totalReturned || 0);
      totalVentasGenerales += totalNeto;
      totalDescuentosGenerales += descuentoTotal;


      // ✅ MEJORADO: Determinar método de pago para mostrar (incluyendo pagos mixtos)
        let methodDisplay = venta.method || 'Sin método';
        let paymentDetails = '';

        if (venta.paymentType === 'mixed' && venta.mixedPayments && venta.mixedPayments.length > 0) {
          // Para pagos mixtos, mostrar todos los métodos y montos
          methodDisplay = venta.mixedPayments.map(p => 
            `${p.method.charAt(0).toUpperCase() + p.method.slice(1)}: $${p.amount.toFixed(2)}`
          ).join(' + ');
          paymentDetails = 'Pago Mixto';
        } else if (venta.method) {
          methodDisplay = venta.method.charAt(0).toUpperCase() + venta.method.slice(1);
          paymentDetails = 'Pago Único';
}

      venta.items.forEach((item) => {
        const precioBruto = item.price * item.quantity;

        // Proporción de descuento por producto
        const proporcionDescuento = totalSinDescuento > 0 ? (precioBruto / totalSinDescuento) : 0;
        const descuentoProducto = proporcionDescuento * descuentoTotal;

        // Precio neto unitario después del descuento
        const precioTotalConDescuento = precioBruto - descuentoProducto;
        const precioUnitarioConDescuento = precioTotalConDescuento / item.quantity;

        // Cálculo del IVA y subtotal
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
          method: methodDisplay,
          paymentDetails: paymentDetails,
          paymentType: venta.paymentType || 'single',
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
          totalReturned: Number((venta.totalReturned || 0).toFixed(2)),
          totalNeto: Number((venta.total - (venta.totalReturned || 0)).toFixed(2)),
          descuento: Number(descuentoProducto.toFixed(2)),
          porcentajeDescuento: Number(porcentajeDescuento.toFixed(2)),
          repartidor: venta.deliveryPerson?.username || "-",
          tienda: venta.tienda?.nombre || "-",
          cliente: venta.cliente?.nombre || "-",
          nota: item.note || ""
        });
      });
    });

    // Resumen estadístico
    const resumen = {
      totalRegistros: resultados.length,
      totalVentas: ventas.length,
      totalVentasGenerales: Number(totalVentasGenerales.toFixed(2)),
      totalDescuentosGenerales: Number(totalDescuentosGenerales.toFixed(2)),
      ventasPorMetodo: {},
      ventasPorTipo: {},
      ventasPorTienda: {}
    };

    // ✅ CORRECCIÓN: Agrupar por método usando total neto (total - totalReturned)
    ventas.forEach(venta => {
      let method = venta.method || 'mixto';
      if (venta.paymentType === 'mixed') {
        method = 'mixto';
      }
      
      // ✅ USAR: Total neto en lugar del total original
      const totalNeto = venta.total - (venta.totalReturned || 0);
      
      resumen.ventasPorMetodo[method] = (resumen.ventasPorMetodo[method] || 0) + totalNeto;
      resumen.ventasPorTipo[venta.type] = (resumen.ventasPorTipo[venta.type] || 0) + totalNeto;
      const tiendaNombre = venta.tienda?.nombre || 'Sin tienda';
      resumen.ventasPorTienda[tiendaNombre] = (resumen.ventasPorTienda[tiendaNombre] || 0) + totalNeto;
    });

    res.json({
      resultados,
      resumen,
      filtros: {
        inicio: startDate.toISOString(),
        fin: endDate.toISOString(),
        tipoVenta,
        tipo,
        tiendaId
      }
    });
  } catch (err) {
    console.error("Error al generar reporte de ventas:", err);
    res.status(500).json({ 
      message: "Error al generar reporte de ventas", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Reporte de ventas resumido (por día/mes)
router.get("/ventas/resumen", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { inicio, fin, agrupacion = 'dia', tiendaId } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ 
        message: "Los parámetros 'inicio' y 'fin' son requeridos" 
      });
    }

    const startDate = new Date(inicio + 'T00:00:00.000Z');
    const endDate = new Date(fin + 'T23:59:59.999Z');

    const matchFilter = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
    }

    // Configurar agrupación por fecha
    let dateGrouping;
    if (agrupacion === 'mes') {
      dateGrouping = {
        year: { $year: "$date" },
        month: { $month: "$date" }
      };
    } else {
      dateGrouping = {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: { $dayOfMonth: "$date" }
      };
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: dateGrouping,
          totalVentas: { $sum: "$total" },
          cantidadVentas: { $sum: 1 },
          totalDescuentos: { $sum: "$discount" },
          ventasEfectivo: {
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $eq: ["$method", "efectivo"] },
                    { $and: [
                      { $eq: ["$paymentType", "mixed"] },
                      { $in: ["efectivo", "$mixedPayments.method"] }
                    ]}
                  ]
                }, 
                "$total", 
                0
              ] 
            }
          },
          ventasTransferencia: {
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $eq: ["$method", "transferencia"] },
                    { $and: [
                      { $eq: ["$paymentType", "mixed"] },
                      { $in: ["transferencia", "$mixedPayments.method"] }
                    ]}
                  ]
                }, 
                "$total", 
                0
              ] 
            }
          },
          ventasTarjeta: {
            $sum: { 
              $cond: [
                { 
                  $or: [
                    { $eq: ["$method", "tarjeta"] },
                    { $and: [
                      { $eq: ["$paymentType", "mixed"] },
                      { $in: ["tarjeta", "$mixedPayments.method"] }
                    ]}
                  ]
                }, 
                "$total", 
                0
              ] 
            }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ];

    const resultado = await Sale.aggregate(pipeline);

    // Formatear fechas para respuesta
    const resumenFormateado = resultado.map(item => {
      let fecha;
      if (agrupacion === 'mes') {
        fecha = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      } else {
        fecha = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      }

      return {
        fecha,
        totalVentas: Number(item.totalVentas.toFixed(2)),
        cantidadVentas: item.cantidadVentas,
        totalDescuentos: Number(item.totalDescuentos.toFixed(2)),
        promedioVenta: Number((item.totalVentas / item.cantidadVentas).toFixed(2)),
        ventasPorMetodo: {
          efectivo: Number(item.ventasEfectivo.toFixed(2)),
          transferencia: Number(item.ventasTransferencia.toFixed(2)),
          tarjeta: Number(item.ventasTarjeta.toFixed(2))
        }
      };
    });

    res.json({
      resumen: resumenFormateado,
      agrupacion,
      periodo: { inicio, fin }
    });
  } catch (err) {
    console.error("Error al generar resumen de ventas:", err);
    res.status(500).json({ 
      message: "Error al generar resumen de ventas", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Reporte de productos más vendidos
router.get("/productos/top", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { inicio, fin, tiendaId, limit = 20 } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ 
        message: "Los parámetros 'inicio' y 'fin' son requeridos" 
      });
    }

    const startDate = new Date(inicio + 'T00:00:00.000Z');
    const endDate = new Date(fin + 'T23:59:59.999Z');

    const matchFilter = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
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

    res.json({
      productos: productosFormateados,
      periodo: { inicio, fin },
      tiendaId: tiendaId || "todas"
    });
  } catch (err) {
    console.error("Error al generar reporte de productos:", err);
    res.status(500).json({ 
      message: "Error al generar reporte de productos", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Reporte de performance de usuarios
router.get("/usuarios/performance", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { inicio, fin, tiendaId } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ 
        message: "Los parámetros 'inicio' y 'fin' son requeridos" 
      });
    }

    const startDate = new Date(inicio + 'T00:00:00.000Z');
    const endDate = new Date(fin + 'T23:59:59.999Z');

    const matchFilter = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
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

    res.json({
      usuarios: usuariosFormateados,
      periodo: { inicio, fin }
    });
  } catch (err) {
    console.error("Error al generar reporte de usuarios:", err);
    res.status(500).json({ 
      message: "Error al generar reporte de usuarios", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Reporte específico de pagos mixtos
router.get("/ventas/mixed-payments", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { inicio, fin, tiendaId } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ 
        message: "Los parámetros 'inicio' y 'fin' son requeridos" 
      });
    }

    const startDate = new Date(inicio + 'T00:00:00.000Z');
    const endDate = new Date(fin + 'T23:59:59.999Z');

    const matchFilter = {
      date: { $gte: startDate, $lte: endDate },
      paymentType: 'mixed'
    };

    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
    }

    const ventasMixtas = await Sale.find(matchFilter)
      .populate("user", "username")
      .populate("cliente", "nombre")
      .populate("tienda", "nombre")
      .sort({ date: -1 })
      .lean();

    const resultados = [];
    let totalMontoPorMetodo = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0
    };

    ventasMixtas.forEach((venta) => {
      // Crear una entrada por cada método de pago en la venta mixta
      venta.mixedPayments.forEach((payment, index) => {
        totalMontoPorMetodo[payment.method] += payment.amount;
        
        resultados.push({
          _id: `${venta._id}_${index}`,
          ventaOriginalId: venta._id,
          date: venta.date,
          user: venta.user?.username || "-",
          cliente: venta.cliente?.nombre || "-",
          tienda: venta.tienda?.nombre || "-",
          totalVentaCompleta: venta.total,
          metodoEspecifico: payment.method,
          montoEspecifico: payment.amount,
          referencia: payment.reference || "-",
          montoRecibido: payment.receivedAmount || payment.amount,
          cambio: payment.method === 'efectivo' && payment.receivedAmount 
            ? Math.max(0, payment.receivedAmount - payment.amount) 
            : 0,
          totalMetodosEnVenta: venta.mixedPayments.length,
          otrosMetodos: venta.mixedPayments
            .filter(p => p.method !== payment.method)
            .map(p => `${p.method}: $${p.amount.toFixed(2)}`)
            .join(', ') || 'Ninguno'
        });
      });
    });

    // Estadísticas de resumen
    const resumen = {
      totalVentasMixtas: ventasMixtas.length,
      totalRegistrosDesglosados: resultados.length,
      montoTotalMixto: ventasMixtas.reduce((sum, v) => sum + v.total, 0),
      montoPorMetodo: totalMontoPorMetodo,
      promedioMetodosPorVenta: ventasMixtas.length > 0 
        ? (resultados.length / ventasMixtas.length).toFixed(2) 
        : 0,
      combinacionesMasUsadas: {}
    };

    // Analizar combinaciones más usadas
    ventasMixtas.forEach(venta => {
      const combinacion = venta.mixedPayments
        .map(p => p.method)
        .sort()
        .join(' + ');
      resumen.combinacionesMasUsadas[combinacion] = 
        (resumen.combinacionesMasUsadas[combinacion] || 0) + 1;
    });

    res.json({
      resultados,
      resumen,
      filtros: { inicio, fin, tiendaId: tiendaId || 'todas' }
    });

  } catch (err) {
    console.error("Error al generar reporte de pagos mixtos:", err);
    res.status(500).json({ 
      message: "Error al generar reporte de pagos mixtos", 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Estadísticas de combinaciones de pagos
router.get("/ventas/payment-combinations", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { inicio, fin, tiendaId } = req.query;

    if (!inicio || !fin) {
      return res.status(400).json({ 
        message: "Los parámetros 'inicio' y 'fin' son requeridos" 
      });
    }

    const startDate = new Date(inicio + 'T00:00:00.000Z');
    const endDate = new Date(fin + 'T23:59:59.999Z');

    const matchFilter = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $project: {
          total: 1,
          paymentType: 1,
          paymentSummary: {
            $cond: {
              if: { $eq: ["$paymentType", "mixed"] },
              then: {
                $reduce: {
                  input: "$mixedPayments",
                  initialValue: "",
                  in: {
                    $concat: [
                      "$$value",
                      { $cond: { if: { $eq: ["$$value", ""] }, then: "", else: "+" } },
                      "$$this.method"
                    ]
                  }
                }
              },
              else: "$method"
            }
          }
        }
      },
      {
        $group: {
          _id: "$paymentSummary",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
          avgAmount: { $avg: "$total" }
        }
      },
      { $sort: { count: -1 } }
    ];

    const combinaciones = await Sale.aggregate(pipeline);

    res.json({
      combinaciones: combinaciones.map(c => ({
        metodosUsados: c._id,
        cantidadVentas: c.count,
        montoTotal: Number(c.totalAmount.toFixed(2)),
        montoPromedio: Number(c.avgAmount.toFixed(2))
      })),
      periodo: { inicio, fin }
    });

  } catch (err) {
    console.error("Error al generar estadísticas de combinaciones:", err);
    res.status(500).json({ 
      message: "Error al generar estadísticas de combinaciones", 
      error: err.message 
    });
  }
});

module.exports = router;