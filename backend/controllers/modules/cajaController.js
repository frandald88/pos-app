const Sale = require('../../core/sales/model');
const Expense = require('../../../modules/gastos/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class CajaController {
  // Reporte de corte de caja
  async getReport(req, res) {
    try {
      const { startDate, endDate, tiendaId, incluirDevoluciones = 'true' } = req.query;

      if (!startDate || !endDate) {
        return errorResponse(res, 'Debes proporcionar startDate y endDate en formato YYYY-MM-DD', 400);
      }

      const inicio = new Date(`${startDate}T00:00:00.000Z`);
      const fin = new Date(`${endDate}T23:59:59.999Z`);

      if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
        return errorResponse(res, 'Formato de fecha inválido. Use YYYY-MM-DD', 400);
      }

      if (inicio > fin) {
        return errorResponse(res, 'La fecha de inicio debe ser anterior a la fecha de fin', 400);
      }

      const filtroVentas = { createdAt: { $gte: inicio, $lte: fin } };
      const filtroGastos = { createdAt: { $gte: inicio, $lte: fin }, status: 'aprobado' };

      if (tiendaId) {
        filtroVentas.tienda = tiendaId;
        filtroGastos.tienda = tiendaId;
      }

      // Total ventas por método de pago
      const ventasPorMetodo = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $group: {
            _id: "$method",
            total: { $sum: "$total" },
            cantidad: { $sum: 1 }
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

      // Total gastos por método de pago
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

      // Devoluciones (si el módulo está activo)
      let totalDevoluciones = 0;
      let detallesDevoluciones = { total: 0, cantidad: 0 };

      if (incluirDevoluciones === 'true') {
        try {
          const Return = require('../../../modules/devoluciones/model');
          const devoluciones = await Return.aggregate([
            { $match: { date: { $gte: inicio, $lte: fin } } },
            { $group: { _id: null, total: { $sum: "$refundAmount" }, cantidad: { $sum: 1 } } }
          ]);
          
          if (devoluciones[0]) {
            totalDevoluciones = devoluciones[0].total;
            detallesDevoluciones = {
              total: Number(totalDevoluciones.toFixed(2)),
              cantidad: devoluciones[0].cantidad
            };
          }
        } catch (error) {
          console.log('Módulo de devoluciones no disponible');
        }
      }

      const cortePorMetodo = {
        efectivo: Number((desglosVentas.efectivo.total - desglosGastos.efectivo.total).toFixed(2)),
        transferencia: Number((desglosVentas.transferencia.total - desglosGastos.transferencia.total).toFixed(2)),
        tarjeta: Number((desglosVentas.tarjeta.total - desglosGastos.tarjeta.total).toFixed(2))
      };

      const corteFinal = Number((totalVentas - totalGastos - totalDevoluciones).toFixed(2));

      const resumenGeneral = {
        totalTransacciones: desglosVentas.efectivo.cantidad + desglosVentas.transferencia.cantidad + desglosVentas.tarjeta.cantidad,
        promedioVenta: totalVentas > 0 ? Number((totalVentas / (desglosVentas.efectivo.cantidad + desglosVentas.transferencia.cantidad + desglosVentas.tarjeta.cantidad)).toFixed(2)) : 0,
        totalGastosAprobados: desglosGastos.efectivo.cantidad + desglosGastos.transferencia.cantidad + desglosGastos.tarjeta.cantidad,
        promedioGasto: totalGastos > 0 ? Number((totalGastos / Math.max(1, desglosGastos.efectivo.cantidad + desglosGastos.transferencia.cantidad + desglosGastos.tarjeta.cantidad)).toFixed(2)) : 0
      };

      return successResponse(res, {
        periodo: {
          inicio: startDate,
          fin: endDate,
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
        resumen: resumenGeneral
      }, 'Reporte de caja generado exitosamente');

    } catch (err) {
      console.error('Error en corte de caja:', err);
      return errorResponse(res, 'Error interno en corte de caja', 500);
    }
  }

  // Movimientos de caja del día
  async getMovements(req, res) {
    try {
      const { fecha = new Date().toISOString().split('T')[0], tiendaId } = req.query;
      
      const inicio = new Date(`${fecha}T00:00:00.000Z`);
      const fin = new Date(`${fecha}T23:59:59.999Z`);

      const filtroBase = { createdAt: { $gte: inicio, $lte: fin } };
      if (tiendaId) filtroBase.tienda = tiendaId;

      const ventas = await Sale.find(filtroBase)
        .populate('user', 'username')
        .populate('tienda', 'nombre')
        .select('total method type createdAt user tienda')
        .sort({ createdAt: -1 })
        .limit(50);

      const gastos = await Expense.find({ ...filtroBase, status: 'aprobado' })
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .select('monto metodoPago concepto createdAt createdBy tienda')
        .sort({ createdAt: -1 })
        .limit(50);

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
          monto: -gasto.monto,
          metodo: gasto.metodoPago,
          descripcion: gasto.concepto,
          usuario: gasto.createdBy?.username || 'N/A',
          tienda: gasto.tienda?.nombre || 'N/A',
          id: gasto._id
        }))
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      return successResponse(res, {
        fecha,
        movimientos: movimientos.slice(0, 100),
        totales: {
          ingresos: ventas.reduce((sum, v) => sum + v.total, 0),
          egresos: gastos.reduce((sum, g) => sum + g.monto, 0),
          balance: ventas.reduce((sum, v) => sum + v.total, 0) - gastos.reduce((sum, g) => sum + g.monto, 0)
        }
      }, 'Movimientos obtenidos exitosamente');

    } catch (err) {
      console.error('Error obteniendo movimientos de caja:', err);
      return errorResponse(res, 'Error al obtener movimientos de caja', 500);
    }
  }

  // Estado actual de caja
  async getStatus(req, res) {
    try {
      const { tiendaId } = req.query;
      const hoy = new Date();
      const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finHoy = new Date(inicioHoy);
      finHoy.setDate(finHoy.getDate() + 1);

      const filtroHoy = { createdAt: { $gte: inicioHoy, $lt: finHoy } };
      if (tiendaId) filtroHoy.tienda = tiendaId;

      const [ventasHoy, gastosHoy] = await Promise.all([
        Sale.aggregate([
          { $match: filtroHoy },
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

      const efectivoDisponible = ventasPorMetodo.efectivo - gastosPorMetodo.efectivo;

      return successResponse(res, {
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
      }, 'Estado de caja obtenido exitosamente');

    } catch (err) {
      console.error('Error obteniendo estado de caja:', err);
      return errorResponse(res, 'Error al obtener estado de caja', 500);
    }
  }
}

module.exports = new CajaController();