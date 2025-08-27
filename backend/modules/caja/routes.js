const express = require('express');
const router = express.Router();
const Sale = require('../../core/sales/model');
const Expense = require('../gastos/model');
const mongoose = require('mongoose');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ MIGRADO + MEJORADO: Reporte de corte de caja
router.get('/reporte', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, startTime = '00:00:00', endTime = '23:59:59', tiendaId, incluirDevoluciones = 'true' } = req.query;

    console.log('🔍 BACKEND - Parámetros recibidos:', { startDate, endDate, startTime, endTime, tiendaId });

    

    // Validaciones
    if (!startDate || !endDate) {
      console.log('❌ BACKEND - Faltan parámetros de fecha');
      return res.status(400).json({ 
        message: 'Debes proporcionar startDate y endDate en formato YYYY-MM-DD' 
      });
    }

    // ✅ NUEVA LÓGICA: Construir fechas con las horas proporcionadas
    const inicio = new Date(`${startDate}T${startTime}.000Z`);
    const fin = new Date(`${endDate}T${endTime}.999Z`);

    console.log('🔍 BACKEND - Fechas construidas:', {
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      inicioLocal: inicio.toString(),
      finLocal: fin.toString()
    });

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      console.log('❌ BACKEND - Fechas inválidas');
      return res.status(400).json({ 
        message: 'Formato de fecha inválido. Use YYYY-MM-DD para fechas y HH:MM:SS para horas' 
      });
    }

    if (inicio > fin) {
      return res.status(400).json({ 
        message: 'La fecha de inicio debe ser anterior a la fecha de fin' 
      });
    }

    // Filtros base
    const filtroVentas = { 
      createdAt: { $gte: inicio, $lte: fin },
      // ✅ MEJORADO: Incluir ventas completadas y parcialmente devueltas
      status: { $in: ['entregado_y_cobrado', 'parcialmente_devuelta'] }
    };
    const filtroGastos = { createdAt: { $gte: inicio, $lte: fin }, status: 'aprobado' };

    if (tiendaId) {
      const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
      filtroVentas.tienda = tiendaObjectId;
      filtroGastos.tienda = tiendaObjectId;
    }

    console.log('🔍 FILTROS CONSTRUIDOS:', {
      filtroVentas,
      filtroGastos,
      tiendaId
    });

    if (tiendaId) {
  const testVentas = await Sale.find({ tienda: tiendaId }).limit(3);
  console.log('🔍 TEST - Ventas encontradas para tienda:', testVentas.length);
  if (testVentas.length > 0) {
    console.log('🔍 TEST - Ejemplo de venta:', {
      id: testVentas[0]._id,
      tienda: testVentas[0].tienda,
      total: testVentas[0].total,
      method: testVentas[0].method,
      createdAt: testVentas[0].createdAt
    });
  }
  
  // También probar sin filtro de tienda
  const testVentasSinFiltro = await Sale.find(filtroVentas).limit(3);
  console.log('🔍 TEST - Ventas con filtro de fecha:', testVentasSinFiltro.length);
}

console.log('🔍 EJECUTANDO CONSULTA VENTAS con filtro:', filtroVentas);

    // 📊 TOTAL VENTAS (por método de pago)
      const ventasPorMetodo = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $facet: {
            // Ventas con pagos únicos
            ventasUnicas: [
              { $match: { $or: [{ paymentType: "single" }, { paymentType: { $exists: false } }] } },
              {
                $group: {
                  _id: "$method",
                  // ✅ NUEVO: Para ventas parcialmente devueltas, usar total neto
                  total: { $sum: { $subtract: ["$total", { $ifNull: ["$totalReturned", 0] }] } },
                  cantidad: { $sum: 1 }
                }
              }
            ],
            // Ventas con pagos mixtos desglosados
            ventasMixtas: [
              { $match: { paymentType: "mixed" } },
              { $unwind: "$mixedPayments" },
              {
                $addFields: {
                  // ✅ NUEVO: Calcular factor de ajuste por devoluciones para pagos mixtos
                  adjustmentFactor: {
                    $divide: [
                      { $subtract: ["$total", { $ifNull: ["$totalReturned", 0] }] },
                      "$total"
                    ]
                  }
                }
              },
              {
                $group: {
                  _id: "$mixedPayments.method",
                  // ✅ NUEVO: Ajustar monto proporcional por devoluciones
                  total: { $sum: { $multiply: ["$mixedPayments.amount", "$adjustmentFactor"] } },
                  cantidad: { $sum: 1 }
                }
              }
            ]
          }
        },
        {
          $project: {
            combinedResults: { $concatArrays: ["$ventasUnicas", "$ventasMixtas"] }
          }
        },
        { $unwind: "$combinedResults" },
        {
          $group: {
            _id: "$combinedResults._id",
            total: { $sum: "$combinedResults.total" },
            cantidad: { $sum: "$combinedResults.cantidad" }
          }
        }
      ]);

    let totalVentas = 0;
    const desglosVentas = {
      efectivo: { total: 0, cantidad: 0 },
      transferencia: { total: 0, cantidad: 0 },
      tarjeta: { total: 0, cantidad: 0 }
    };

    ventasPorMetodo.forEach(venta => {
      totalVentas += venta.total;
      if (desglosVentas[venta._id]) {
        desglosVentas[venta._id] = {
          total: Number(venta.total.toFixed(2)),
          cantidad: venta.cantidad
        };
      }
    });

    console.log('🔍 RESULTADO VENTAS POR MÉTODO:', ventasPorMetodo);
    console.log('🔍 TOTAL VENTAS CALCULADO:', totalVentas);

    // 📊 TOTAL GASTOS (por método de pago)
    const gastosPorMetodo = await Expense.aggregate([
      { $match: filtroGastos },
      {
        $group: {
          _id: "$metodoPago",
          total: { $sum: "$monto" },
          cantidad: { $sum: 1 }
        }
      }
    ]);

    let totalGastos = 0;
    const desglosGastos = {
      efectivo: { total: 0, cantidad: 0 },
      transferencia: { total: 0, cantidad: 0 },
      tarjeta: { total: 0, cantidad: 0 }
    };

    gastosPorMetodo.forEach(gasto => {
      totalGastos += gasto.total;
      if (desglosGastos[gasto._id]) {
        desglosGastos[gasto._id] = {
          total: Number(gasto.total.toFixed(2)),
          cantidad: gasto.cantidad
        };
      }
    });

    console.log('🔍 RESULTADO GASTOS POR MÉTODO:', gastosPorMetodo);
    console.log('🔍 TOTAL GASTOS CALCULADO:', totalGastos);


    // 📊 ESTADÍSTICAS DE PAGOS MIXTOS
    const mixedPaymentStats = await Sale.aggregate([
      { 
        $match: { 
          ...filtroVentas, 
          paymentType: "mixed" 
        } 
      },
      {
        $group: {
          _id: null,
          totalVentasMixtas: { $sum: 1 },
          montoTotalMixto: { $sum: "$total" },
          promedioMetodosPorVenta: { $avg: { $size: "$mixedPayments" } }
        }
      }
    ]);

    const estadisticasMixtas = mixedPaymentStats[0] || {
      totalVentasMixtas: 0,
      montoTotalMixto: 0,
      promedioMetodosPorVenta: 0
    };

    // 📊 DEVOLUCIONES (solo para información - ya están integradas en las ventas netas)
    let detallesDevoluciones = { total: 0, cantidad: 0 };

    if (incluirDevoluciones === 'true') {
  try {
    // Intentar cargar modelo de devoluciones si existe
    const Return = require('../devoluciones/model');
    
    // ✅ AGREGAR: Filtro para devoluciones con tienda
    const filtroDevolucion = { date: { $gte: inicio, $lte: fin } };
    if (tiendaId) {
      const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
      filtroDevolucion.tienda = tiendaObjectId;
    }
    
    const devoluciones = await Return.aggregate([
      { $match: filtroDevolucion },
      { $group: { _id: null, total: { $sum: "$refundAmount" }, cantidad: { $sum: 1 } } }
    ]);
        
        if (devoluciones[0]) {
          // ✅ MOSTRAR devoluciones para información, pero NO las restamos del balance
          detallesDevoluciones = {
            total: Number(devoluciones[0].total.toFixed(2)),
            cantidad: devoluciones[0].cantidad
          };
        }
      } catch (error) {
        // Si no existe el módulo de devoluciones, continuar sin error
        console.log('Módulo de devoluciones no disponible');
      }
    }

    // 📊 CÁLCULOS FINALES
    const cortePorMetodo = {
      efectivo: Number((desglosVentas.efectivo.total - desglosGastos.efectivo.total).toFixed(2)),
      transferencia: Number((desglosVentas.transferencia.total - desglosGastos.transferencia.total).toFixed(2)),
      tarjeta: Number((desglosVentas.tarjeta.total - desglosGastos.tarjeta.total).toFixed(2))
    };

    // ✅ CORRECCIÓN: No restar devoluciones porque ya están descontadas de totalVentas
    const corteFinal = Number((totalVentas - totalGastos).toFixed(2));

    // 📊 ESTADÍSTICAS ADICIONALES
    const resumenGeneral = {
      totalTransacciones: desglosVentas.efectivo.cantidad + desglosVentas.transferencia.cantidad + desglosVentas.tarjeta.cantidad,
      promedioVenta: totalVentas > 0 ? Number((totalVentas / (desglosVentas.efectivo.cantidad + desglosVentas.transferencia.cantidad + desglosVentas.tarjeta.cantidad)).toFixed(2)) : 0,
      totalGastosAprobados: desglosGastos.efectivo.cantidad + desglosGastos.transferencia.cantidad + desglosGastos.tarjeta.cantidad,
      promedioGasto: totalGastos > 0 ? Number((totalGastos / Math.max(1, desglosGastos.efectivo.cantidad + desglosGastos.transferencia.cantidad + desglosGastos.tarjeta.cantidad)).toFixed(2)) : 0
    };

    res.json({
      periodo: {
        inicio: inicio.toISOString(),  // ✅ Devolver fecha completa con hora
        fin: fin.toISOString(),        // ✅ Devolver fecha completa con hora
        tiendaId: tiendaId || 'todas'
      },
      ventas: {
        total: Number(totalVentas.toFixed(2)),
        desglose: desglosVentas
      },
      gastos: {
        total: Number(totalGastos.toFixed(2)),
        desglose: desglosGastos
      },
      devoluciones: detallesDevoluciones,
      corte: {
        porMetodo: cortePorMetodo,
        final: corteFinal,
        sinDevoluciones: Number((totalVentas - totalGastos).toFixed(2))
      },
      resumen: resumenGeneral,
      pagosMixtos: {
      totalVentas: estadisticasMixtas.totalVentasMixtas,
      montoTotal: Number(estadisticasMixtas.montoTotalMixto.toFixed(2)),
      promedioMetodos: Number(estadisticasMixtas.promedioMetodosPorVenta.toFixed(2)),
      porcentajeDelTotal: totalVentas > 0 ? Number(((estadisticasMixtas.montoTotalMixto / totalVentas) * 100).toFixed(2)) : 0
}

    });

  } catch (err) {
    console.error('Error en corte de caja:', err);
    res.status(500).json({ 
      message: 'Error interno en corte de caja', 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Movimientos de caja del día actual
router.get('/movimientos', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { fecha = new Date().toISOString().split('T')[0], tiendaId } = req.query;
    
    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    const fin = new Date(`${fecha}T23:59:59.999Z`);

    const filtroBase = { createdAt: { $gte: inicio, $lte: fin } };
      if (tiendaId) {
        const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
        filtroBase.tienda = tiendaObjectId;
      }

    // Obtener ventas del día
    const ventas = await Sale.find({
        ...filtroBase,
        status: 'entregado_y_cobrado' // ← Solo ventas completadas
      })
      .populate('user', 'username')
      .populate('tienda', 'nombre')
      .select('total method type createdAt user tienda')
      .sort({ createdAt: -1 })
      .limit(50);

    // Obtener gastos del día
    const gastos = await Expense.find({ ...filtroBase, status: 'aprobado' })
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre')
      .select('monto metodoPago concepto createdAt createdBy tienda')
      .sort({ createdAt: -1 })
      .limit(50);

    // Combinar y ordenar movimientos
    const movimientos = [
      ...ventas.map(venta => ({
        tipo: 'venta',
        fecha: venta.createdAt,
        monto: venta.total,
        metodo: venta.method,
        descripcion: `Venta ${venta.type}`,
        usuario: venta.user?.username || 'N/A',
        tienda: venta.tienda?.nombre || 'N/A',
        id: venta._id
      })),
      ...gastos.map(gasto => ({
        tipo: 'gasto',
        fecha: gasto.createdAt,
        monto: -gasto.monto, // Negativo porque es salida
        metodo: gasto.metodoPago,
        descripcion: gasto.concepto,
        usuario: gasto.createdBy?.username || 'N/A',
        tienda: gasto.tienda?.nombre || 'N/A',
        id: gasto._id
      }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      fecha,
      movimientos: movimientos.slice(0, 100), // Limitar a 100 movimientos más recientes
      totales: {
        ingresos: ventas.reduce((sum, v) => sum + v.total, 0),
        egresos: gastos.reduce((sum, g) => sum + g.monto, 0),
        balance: ventas.reduce((sum, v) => sum + v.total, 0) - gastos.reduce((sum, g) => sum + g.monto, 0)
      }
    });

  } catch (err) {
    console.error('Error obteniendo movimientos de caja:', err);
    res.status(500).json({ 
      message: 'Error al obtener movimientos de caja', 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Resumen de caja por período (semanal/mensual)
router.get('/resumen/:periodo', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { periodo } = req.params; // 'semana' o 'mes'
    const { tiendaId } = req.query;

    let inicio, fin;
    const hoy = new Date();

    if (periodo === 'semana') {
      // Inicio de la semana (lunes)
      const diaSemana = hoy.getDay();
      const diasAtras = diaSemana === 0 ? 6 : diaSemana - 1;
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - diasAtras);
      inicio.setHours(0, 0, 0, 0);
      
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
    } else if (periodo === 'mes') {
      // Inicio del mes
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      return res.status(400).json({ 
        message: 'Período inválido. Use "semana" o "mes"' 
      });
    }

    const filtroBase = { createdAt: { $gte: inicio, $lte: fin } };
    if (tiendaId) {
      const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
      filtroBase.tienda = tiendaObjectId;
    }

    // Obtener totales
    const [ventasTotal, gastosTotal] = await Promise.all([
      Sale.aggregate([
        { $match: { ...filtroBase, status: 'entregado_y_cobrado' } },
        { $group: { _id: null, total: { $sum: "$total" }, cantidad: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { ...filtroBase, status: 'aprobado' } },
        { $group: { _id: null, total: { $sum: "$monto" }, cantidad: { $sum: 1 } } }
      ])
    ]);

    const resumenVentas = ventasTotal[0] || { total: 0, cantidad: 0 };
    const resumenGastos = gastosTotal[0] || { total: 0, cantidad: 0 };

    const balance = resumenVentas.total - resumenGastos.total;

    res.json({
      periodo: {
        tipo: periodo,
        inicio: inicio.toISOString().split('T')[0],
        fin: fin.toISOString().split('T')[0],
        tiendaId: tiendaId || 'todas'
      },
      ventas: {
        total: Number(resumenVentas.total.toFixed(2)),
        cantidad: resumenVentas.cantidad,
        promedio: resumenVentas.cantidad > 0 ? Number((resumenVentas.total / resumenVentas.cantidad).toFixed(2)) : 0
      },
      gastos: {
        total: Number(resumenGastos.total.toFixed(2)),
        cantidad: resumenGastos.cantidad,
        promedio: resumenGastos.cantidad > 0 ? Number((resumenGastos.total / resumenGastos.cantidad).toFixed(2)) : 0
      },
      balance: Number(balance.toFixed(2)),
      rentabilidad: resumenVentas.total > 0 ? Number(((balance / resumenVentas.total) * 100).toFixed(2)) : 0
    });

  } catch (err) {
    console.error('Error en resumen de caja:', err);
    res.status(500).json({ 
      message: 'Error al generar resumen de caja', 
      error: err.message 
    });
  }
});

// ✅ NUEVO: Estado actual de caja (tiempo real)
router.get('/estado', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tiendaId } = req.query;
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy);
    finHoy.setDate(finHoy.getDate() + 1);

    const filtroHoy = { createdAt: { $gte: inicioHoy, $lt: finHoy } };
      if (tiendaId) {
        const tiendaObjectId = new mongoose.Types.ObjectId(tiendaId);
        filtroHoy.tienda = tiendaObjectId;
      }

    // Obtener datos del día actual
    const [ventasHoy, gastosHoy] = await Promise.all([
      Sale.aggregate([
        { $match: { ...filtroHoy, status: 'entregado_y_cobrado' } },
        {
          $group: {
            _id: "$method",
            total: { $sum: "$total" },
            cantidad: { $sum: 1 }
          }
        }
      ]),
      Expense.aggregate([
        { $match: { ...filtroHoy, status: 'aprobado' } },
        {
          $group: {
            _id: "$metodoPago",
            total: { $sum: "$monto" },
            cantidad: { $sum: 1 }
          }
        }
      ])
    ]);

    // Procesar ventas por método
    const ventasPorMetodo = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0
    };
    let totalVentasHoy = 0;

    ventasHoy.forEach(venta => {
      if (ventasPorMetodo.hasOwnProperty(venta._id)) {
        ventasPorMetodo[venta._id] = venta.total;
      }
      totalVentasHoy += venta.total;
    });

    // Procesar gastos por método
    const gastosPorMetodo = {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0
    };
    let totalGastosHoy = 0;

    gastosHoy.forEach(gasto => {
      if (gastosPorMetodo.hasOwnProperty(gasto._id)) {
        gastosPorMetodo[gasto._id] = gasto.total;
      }
      totalGastosHoy += gasto.total;
    });

    // Calcular efectivo disponible
    const efectivoDisponible = ventasPorMetodo.efectivo - gastosPorMetodo.efectivo;

    res.json({
      fecha: inicioHoy.toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-MX'),
      tienda: tiendaId || 'todas',
      estado: {
        ventasHoy: Number(totalVentasHoy.toFixed(2)),
        gastosHoy: Number(totalGastosHoy.toFixed(2)),
        balanceHoy: Number((totalVentasHoy - totalGastosHoy).toFixed(2)),
        efectivoDisponible: Number(efectivoDisponible.toFixed(2))
      },
      desglose: {
        ventas: {
          efectivo: Number(ventasPorMetodo.efectivo.toFixed(2)),
          transferencia: Number(ventasPorMetodo.transferencia.toFixed(2)),
          tarjeta: Number(ventasPorMetodo.tarjeta.toFixed(2))
        },
        gastos: {
          efectivo: Number(gastosPorMetodo.efectivo.toFixed(2)),
          transferencia: Number(gastosPorMetodo.transferencia.toFixed(2)),
          tarjeta: Number(gastosPorMetodo.tarjeta.toFixed(2))
        }
      },
      alertas: {
        efectivoBajo: efectivoDisponible < 1000,
        gastosAltos: totalGastosHoy > (totalVentasHoy * 0.3),
        sinVentas: totalVentasHoy === 0
      }
    });

  } catch (err) {
    console.error('Error obteniendo estado de caja:', err);
    res.status(500).json({ 
      message: 'Error al obtener estado de caja', 
      error: err.message 
    });
  }
});

module.exports = router;