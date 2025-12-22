const Sale = require('../../core/sales/model');
const Expense = require('../../core/gastos/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class CajaController {
  // Reporte de corte de caja con soporte para horas específicas, pagos mixtos y turnos
  async getReport(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { startDate, endDate, startTime = '00:00:00', endTime = '23:59:59', tiendaId, turnoId, incluirDevoluciones = 'true' } = req.query;
      const mongoose = require('mongoose');
      const Turno = require('../../core/turnos/model');
      const Product = require('../../core/products/model');

      // ⭐ Tasa de IVA (10% como en reportes)
      const IVA_RATE = 0.10;

      console.log('🔍 BACKEND - Parámetros recibidos:', { startDate, endDate, startTime, endTime, tiendaId, turnoId });

      // ⭐ Si se proporciona turnoId, usar las fechas del turno
      let turnoSeleccionado = null;
      let inicioMexico, finMexico, tiendaIdFinal;

      if (turnoId) {
        console.log('🔍 BACKEND - Generando corte por turno:', turnoId);

        turnoSeleccionado = await Turno.findOne({ _id: turnoId, tenantId: req.tenantId })
          .populate('usuario', 'username')
          .populate('usuarioCierre', 'username')
          .populate('tienda', 'nombre direccion telefono');

        if (!turnoSeleccionado) {
          return errorResponse(res, 'Turno no encontrado', 404);
        }

        // Usar fechas del turno
        inicioMexico = turnoSeleccionado.fechaApertura;
        finMexico = turnoSeleccionado.fechaCierre || new Date(); // Si está abierto, usar fecha actual
        tiendaIdFinal = turnoSeleccionado.tienda._id.toString();

        console.log('🔍 BACKEND - Fechas del turno:', {
          inicio: inicioMexico.toISOString(),
          fin: finMexico.toISOString(),
          tienda: turnoSeleccionado.tienda.nombre
        });
      } else {
        // Modo tradicional: usar fechas proporcionadas
        if (!startDate || !endDate) {
          console.log('❌ BACKEND - Faltan parámetros de fecha');
          return errorResponse(res, 'Debes proporcionar startDate y endDate en formato YYYY-MM-DD, o turnoId', 400);
        }

        tiendaIdFinal = tiendaId;

        // Construir fechas en zona horaria local (México UTC-6)
        // Crear fechas locales sin forzar UTC
        const inicio = new Date(`${startDate}T${startTime}`);
        const fin = new Date(`${endDate}T${endTime}`);

        // Ajustar a zona horaria de México si es necesario
        const mexicoOffset = -6 * 60; // -6 horas en minutos
        const adjustToMexicoTime = (date) => {
          const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
          return new Date(utcTime + (mexicoOffset * 60000));
        };

        inicioMexico = adjustToMexicoTime(inicio);
        finMexico = adjustToMexicoTime(fin);
      }

      console.log('🔍 BACKEND - Fechas construidas:', {
        inicioMexico: inicioMexico.toISOString(),
        finMexico: finMexico.toISOString()
      });

      if (isNaN(inicioMexico.getTime()) || isNaN(finMexico.getTime())) {
        console.log('❌ BACKEND - Fechas inválidas');
        return errorResponse(res, 'Formato de fecha inválido. Use YYYY-MM-DD para fechas y HH:MM:SS para horas', 400);
      }

      if (inicioMexico > finMexico) {
        return errorResponse(res, 'La fecha de inicio debe ser anterior a la fecha de fin', 400);
      }

      // Filtros base usando fechas de México
      // ⭐ IMPORTANTE: Lógica combinada para contar ventas correctamente:
      // 1. Ventas SIN devoluciones: usar updatedAt (para capturar ventas completadas en este turno)
      // 2. Ventas CON devoluciones parciales: usar createdAt (para mantenerlas en el turno original donde se cobró)
      // Esto evita que ventas se "muevan" al turno donde se hizo la devolución
      // Convertir tenantId a ObjectId para el aggregation
      const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);

      const filtroVentas = {
        tenantId: tenantObjectId, // Filtrar por tenant (como ObjectId)
        $or: [
          // Ventas completadas durante este turno (sin devoluciones aún)
          {
            status: 'entregado_y_cobrado',
            updatedAt: { $gte: new Date(inicioMexico), $lte: new Date(finMexico) }
          },
          // Ventas con devoluciones parciales - contar en turno donde se vendió originalmente
          {
            status: 'parcialmente_devuelta',
            createdAt: { $gte: new Date(inicioMexico), $lte: new Date(finMexico) }
          }
        ]
      };
      const filtroGastos = {
        tenantId: tenantObjectId, // Filtrar por tenant (como ObjectId para aggregation)
        updatedAt: { $gte: inicioMexico, $lte: finMexico }, // Usar updatedAt para capturar gastos aprobados durante el turno
        status: 'aprobado'
      };

      if (tiendaIdFinal) {
        const tiendaObjectId = new mongoose.Types.ObjectId(tiendaIdFinal);
        filtroVentas.tienda = tiendaObjectId;
        filtroGastos.tienda = tiendaObjectId;
      }

      console.log('🔍 EJECUTANDO CONSULTA VENTAS con filtro:', JSON.stringify(filtroVentas, null, 2));
      console.log('🔍 EJECUTANDO CONSULTA GASTOS con filtro:', JSON.stringify(filtroGastos, null, 2));
      console.log('🔍 Buscando ventas desde:', inicioMexico.toISOString(), 'hasta:', finMexico.toISOString());
      console.log('🔍 Estados incluidos en corte de caja:', ['entregado_y_cobrado', 'parcialmente_devuelta']);
      console.log('💡 Lógica aplicada:');
      console.log('  - Ventas sin devoluciones: se filtran por updatedAt (turno donde se completaron)');
      console.log('  - Ventas con devoluciones: se filtran por createdAt (turno donde se cobraron originalmente)');
      console.log('  - Gastos: se filtran por updatedAt (turno donde se aprobaron)');

      // Ventas con soporte para pagos mixtos y devoluciones
      const ventasPorMetodo = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $facet: {
            ventasUnicas: [
              { $match: { $or: [{ paymentType: "single" }, { paymentType: { $exists: false } }] } },
              {
                $group: {
                  _id: "$method",
                  total: { $sum: { $subtract: ["$total", { $ifNull: ["$totalReturned", 0] }] } },
                  cantidad: { $sum: 1 }
                }
              }
            ],
            ventasMixtas: [
              { $match: { paymentType: "mixed" } },
              { $unwind: "$mixedPayments" },
              {
                $addFields: {
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

      console.log('🔍 TOTAL VENTAS CALCULADO:', totalVentas);

      // Gastos por método de pago
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

      console.log('🔍 GASTOS ENCONTRADOS:', gastosPorMetodo);

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

      console.log('🔍 TOTAL GASTOS CALCULADO:', totalGastos);
      console.log('🔍 DESGLOSE GASTOS:', desglosGastos);

      // Estadísticas de pagos mixtos
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

      // ⭐ NUEVO: Información del turno activo o del período
      let turnoInfo = null;
      if (turnoSeleccionado) {
        // Si ya tenemos el turno seleccionado (modo turnoId), usarlo directamente
        turnoInfo = {
          _id: turnoSeleccionado._id,
          efectivoInicial: turnoSeleccionado.efectivoInicial || 0,
          efectivoFinal: turnoSeleccionado.efectivoFinal || null,
          cajero: turnoSeleccionado.usuario?.username || 'N/A',
          estacion: turnoSeleccionado.estacion || 'N/A',
          fechaApertura: turnoSeleccionado.fechaApertura,
          fechaCierre: turnoSeleccionado.fechaCierre,
          estado: turnoSeleccionado.estado,
          usuarioCierre: turnoSeleccionado.usuarioCierre?.username || null,
          notasApertura: turnoSeleccionado.notasApertura || '',
          notasCierre: turnoSeleccionado.notasCierre || '',
          cerradoPor: turnoSeleccionado.usuarioCierre?.username || null
        };
      } else if (tiendaIdFinal) {
        // Buscar turno que esté abierto durante el período del reporte (modo tradicional)
        const turno = await Turno.findOne({
          tenantId: req.tenantId, // Filtrar por tenant
          tienda: new mongoose.Types.ObjectId(tiendaIdFinal),
          fechaApertura: { $lte: finMexico },
          $or: [
            { fechaCierre: { $gte: inicioMexico } },
            { fechaCierre: null, estado: 'abierto' }
          ]
        })
        .populate('usuario', 'username')
        .populate('usuarioCierre', 'username')
        .populate('tienda', 'nombre')
        .sort({ fechaApertura: -1 })
        .limit(1);

        if (turno) {
          turnoInfo = {
            efectivoInicial: turno.efectivoInicial || 0,
            efectivoFinal: turno.efectivoFinal || null,
            cajero: turno.usuario?.username || 'N/A',
            estacion: turno.estacion || 'N/A',
            fechaApertura: turno.fechaApertura,
            fechaCierre: turno.fechaCierre,
            estado: turno.estado,
            notasApertura: turno.notasApertura || '',
            notasCierre: turno.notasCierre || '',
            cerradoPor: turno.usuarioCierre?.username || null
          };
        }
      }

      // ⭐ NUEVO: Descuentos totales
      const descuentosStats = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $group: {
            _id: null,
            totalDescuentos: { $sum: "$discount" },
            ventasConDescuento: {
              $sum: { $cond: [{ $gt: ["$discount", 0] }, 1, 0] }
            }
          }
        }
      ]);

      const descuentos = descuentosStats[0] || {
        totalDescuentos: 0,
        ventasConDescuento: 0
      };

      // ⭐ NUEVO: Propinas totales
      const propinasStats = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $group: {
            _id: null,
            totalPropinas: { $sum: { $ifNull: ["$tip.amount", 0] } },
            ventasConPropina: {
              $sum: { $cond: [{ $gt: [{ $ifNull: ["$tip.amount", 0] }, 0] }, 1, 0] }
            }
          }
        }
      ]);

      const propinas = propinasStats[0] || {
        totalPropinas: 0,
        ventasConPropina: 0
      };

      // ⭐ NUEVO: Ventas canceladas
      const ventasCanceladas = await Sale.countDocuments({
        tenantId: req.tenantId, // Filtrar por tenant
        createdAt: { $gte: inicioMexico, $lte: finMexico },
        status: 'cancelada',
        ...(tiendaIdFinal && { tienda: new mongoose.Types.ObjectId(tiendaIdFinal) })
      });

      // ⭐ NUEVO: Por tipo de servicio
      const ventasPorTipo = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $group: {
            _id: "$type",
            total: { $sum: { $subtract: ["$total", { $ifNull: ["$totalReturned", 0] }] } },
            cantidad: { $sum: 1 }
          }
        }
      ]);

      const porTipoServicio = {
        mostrador: { total: 0, cantidad: 0 },
        domicilio: { total: 0, cantidad: 0 },
        recoger: { total: 0, cantidad: 0 }
      };

      ventasPorTipo.forEach(tipo => {
        if (porTipoServicio[tipo._id]) {
          porTipoServicio[tipo._id] = {
            total: Number(tipo.total.toFixed(2)),
            cantidad: tipo.cantidad
          };
        }
      });

      // ⭐ NUEVO: Folio inicial y final
      const foliosStats = await Sale.aggregate([
        { $match: filtroVentas },
        {
          $group: {
            _id: null,
            folioInicial: { $min: "$folio" },
            folioFinal: { $max: "$folio" }
          }
        }
      ]);

      const folios = foliosStats[0] || {
        folioInicial: null,
        folioFinal: null
      };

      // ⭐ NUEVO: Cálculo de IVA (desglose fiscal)
      // Calcular IVA sobre el total de ventas después de devoluciones
      const totalVentasConDevoluciones = totalVentas; // Ya tiene devoluciones restadas
      const subtotalSinIVA = totalVentasConDevoluciones / (1 + IVA_RATE);
      const ivaTotal = totalVentasConDevoluciones - subtotalSinIVA;

      const impuestos = {
        tasa: IVA_RATE,
        tasaPorcentaje: (IVA_RATE * 100).toFixed(0) + '%',
        subtotal: Number(subtotalSinIVA.toFixed(2)),
        iva: Number(ivaTotal.toFixed(2)),
        total: Number(totalVentasConDevoluciones.toFixed(2))
      };

      // ⭐ NUEVO: Por categoría de producto (Medium complexity)
      const ventasPorCategoria = await Sale.aggregate([
        { $match: filtroVentas },
        { $unwind: "$items" },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'producto'
          }
        },
        { $unwind: { path: "$producto", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$producto.category", "Sin categoría"] },
            total: {
              $sum: {
                $multiply: [
                  "$items.price",
                  "$items.quantity",
                  {
                    $divide: [
                      { $subtract: ["$total", { $ifNull: ["$totalReturned", 0] }] },
                      "$total"
                    ]
                  }
                ]
              }
            },
            cantidad: { $sum: "$items.quantity" }
          }
        },
        { $sort: { total: -1 } }
      ]);

      const porCategoria = ventasPorCategoria.map(cat => ({
        categoria: cat._id,
        total: Number(cat.total.toFixed(2)),
        cantidad: cat.cantidad
      }));

      // ⭐ NUEVO: Descuentos por categoría (Medium complexity)
      const descuentosPorCategoria = await Sale.aggregate([
        { $match: { ...filtroVentas, discount: { $gt: 0 } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'producto'
          }
        },
        { $unwind: { path: "$producto", preserveNullAndEmptyArrays: true } },
        // ⭐ CORRECCIÓN: Calcular subtotal sin descuento para distribuir correctamente
        {
          $addFields: {
            subtotalSinDescuento: { $add: ["$total", "$discount"] }
          }
        },
        {
          $group: {
            _id: { $ifNull: ["$producto.category", "Sin categoría"] },
            totalDescuentos: {
              $sum: {
                $multiply: [
                  "$discount",
                  {
                    $divide: [
                      { $multiply: ["$items.price", "$items.quantity"] },
                      "$subtotalSinDescuento"  // ⭐ Usar subtotal SIN descuento
                    ]
                  }
                ]
              }
            },
            cantidad: { $sum: 1 }
          }
        },
        { $sort: { totalDescuentos: -1 } }
      ]);

      const descuentosPorCat = descuentosPorCategoria.map(cat => ({
        categoria: cat._id,
        totalDescuentos: Number(cat.totalDescuentos.toFixed(2)),
        cantidad: cat.cantidad
      }));

      // Devoluciones (información y desglose por método)
      let detallesDevoluciones = { total: 0, cantidad: 0 };
      const desgloseDevoluciones = {
        efectivo: { total: 0, cantidad: 0 },
        transferencia: { total: 0, cantidad: 0 },
        tarjeta: { total: 0, cantidad: 0 }
      };

      if (incluirDevoluciones === 'true') {
        try {
          const Return = require('../../core/devoluciones/model');

          const filtroDevolucion = {
            tenantId: tenantObjectId, // Filtrar por tenant
            date: { $gte: inicioMexico, $lte: finMexico }
          };
          if (tiendaIdFinal) {
            const tiendaObjectId = new mongoose.Types.ObjectId(tiendaIdFinal);
            filtroDevolucion.tienda = tiendaObjectId;
          }

          // Total de devoluciones
          const devoluciones = await Return.aggregate([
            { $match: filtroDevolucion },
            { $group: { _id: null, total: { $sum: "$refundAmount" }, cantidad: { $sum: 1 } } }
          ]);

          if (devoluciones[0]) {
            detallesDevoluciones = {
              total: Number(devoluciones[0].total.toFixed(2)),
              cantidad: devoluciones[0].cantidad
            };
          }

          // ⭐ NUEVO: Desglose de devoluciones por método usando refundMethod
          const devolucionesPorMetodo = await Return.aggregate([
            { $match: filtroDevolucion },
            {
              $facet: {
                devolucionesUnicas: [
                  { $match: { $or: [{ originalPaymentType: "single" }, { originalPaymentType: { $exists: false } }] } },
                  {
                    $group: {
                      _id: "$refundMethod",
                      total: { $sum: "$refundAmount" },
                      cantidad: { $sum: 1 }
                    }
                  }
                ],
                devolucionesMixtas: [
                  { $match: { originalPaymentType: "mixed" } },
                  { $unwind: "$mixedRefunds" },
                  {
                    $group: {
                      _id: "$mixedRefunds.method",
                      total: { $sum: "$mixedRefunds.amount" },
                      cantidad: { $sum: 1 }
                    }
                  }
                ]
              }
            },
            {
              $project: {
                combinedResults: { $concatArrays: ["$devolucionesUnicas", "$devolucionesMixtas"] }
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

          devolucionesPorMetodo.forEach(devolucion => {
            const metodo = devolucion._id;
            if (desgloseDevoluciones[metodo]) {
              desgloseDevoluciones[metodo] = {
                total: Number(devolucion.total.toFixed(2)),
                cantidad: devolucion.cantidad
              };
            }
          });

          console.log('🔍 DEVOLUCIONES POR MÉTODO:', desgloseDevoluciones);
        } catch (error) {
          console.log('⚠️ Error procesando devoluciones:', error.message);
        }
      }

      // ⭐ CORREGIDO: Restar devoluciones por método de devolución (no método original)
      const cortePorMetodo = {
        efectivo: Number((desglosVentas.efectivo.total - desglosGastos.efectivo.total - desgloseDevoluciones.efectivo.total).toFixed(2)),
        transferencia: Number((desglosVentas.transferencia.total - desglosGastos.transferencia.total - desgloseDevoluciones.transferencia.total).toFixed(2)),
        tarjeta: Number((desglosVentas.tarjeta.total - desglosGastos.tarjeta.total - desgloseDevoluciones.tarjeta.total).toFixed(2))
      };

      const corteFinal = Number((totalVentas - totalGastos).toFixed(2));

      // ⭐ Contar ventas únicas correctamente (no por método de pago)
      // Esto es importante porque pagos mixtos cuentan múltiples métodos pero es 1 sola venta
      const totalVentasUnicas = await Sale.countDocuments(filtroVentas);
      const totalGastosUnicos = await Expense.countDocuments(filtroGastos);

      const resumenGeneral = {
        totalTransacciones: totalVentasUnicas,
        promedioVenta: totalVentas > 0 ? Number((totalVentas / Math.max(1, totalVentasUnicas)).toFixed(2)) : 0,
        totalGastosAprobados: totalGastosUnicos,
        promedioGasto: totalGastos > 0 ? Number((totalGastos / Math.max(1, totalGastosUnicos)).toFixed(2)) : 0
      };

      return successResponse(res, {
        periodo: {
          inicio: inicioMexico.toISOString(),
          fin: finMexico.toISOString(),
          tiendaId: tiendaIdFinal || 'todas',
          modo: turnoId ? 'turno' : 'periodo', // ⭐ Indicar el modo del reporte
          turnoId: turnoId || null
        },
        ventas: {
          total: Number(totalVentas.toFixed(2)),
          desglose: desglosVentas
        },
        gastos: {
          total: Number(totalGastos.toFixed(2)),
          desglose: desglosGastos
        },
        devoluciones: {
          ...detallesDevoluciones,
          desglose: desgloseDevoluciones
        },
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
        },
        // ⭐ NUEVOS DATOS
        turno: turnoInfo,
        descuentos: {
          total: Number(descuentos.totalDescuentos.toFixed(2)),
          ventasConDescuento: descuentos.ventasConDescuento
        },
        propinas: {
          total: Number(propinas.totalPropinas.toFixed(2)),
          ventasConPropina: propinas.ventasConPropina
        },
        ventasCanceladas: ventasCanceladas,
        porTipoServicio: porTipoServicio,
        folios: folios,
        porCategoria: porCategoria,
        descuentosPorCategoria: descuentosPorCat,
        impuestos: impuestos
      }, 'Reporte de caja generado exitosamente');

    } catch (err) {
      console.error('Error en corte de caja:', err);
      return errorResponse(res, 'Error interno en corte de caja', 500);
    }
  }

  // Movimientos de caja del día
  async getMovements(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { fecha = new Date().toISOString().split('T')[0], tiendaId } = req.query;
      
      // Crear fechas en zona horaria local (México)
      const inicio = new Date(`${fecha}T00:00:00`);
      const fin = new Date(`${fecha}T23:59:59`);
      
      // Ajustar a zona horaria de México
      const mexicoOffset = -6 * 60; // -6 horas en minutos
      const adjustToMexicoTime = (date) => {
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utcTime + (mexicoOffset * 60000));
      };
      
      const inicioMexico = adjustToMexicoTime(inicio);
      const finMexico = adjustToMexicoTime(fin);

      const filtroBase = {
        tenantId: req.tenantId, // Filtrar por tenant
        createdAt: { $gte: inicioMexico, $lte: finMexico }
      };
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
      // Validar tenantId
      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant no identificado' });
      }

      const { tiendaId } = req.query;
      
      // Obtener fecha actual en zona horaria de México
      const mexicoOffset = -6 * 60; // -6 horas en minutos
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const mexicoTime = new Date(utcTime + (mexicoOffset * 60000));
      
      // Crear inicio y fin del día en zona horaria de México
      const inicioHoy = new Date(mexicoTime.getFullYear(), mexicoTime.getMonth(), mexicoTime.getDate());
      const finHoy = new Date(inicioHoy);
      finHoy.setDate(finHoy.getDate() + 1);

      const filtroHoy = {
        tenantId: req.tenantId, // Filtrar por tenant
        createdAt: { $gte: inicioHoy, $lt: finHoy }
      };
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