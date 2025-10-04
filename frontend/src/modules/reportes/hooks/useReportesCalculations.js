import { useMemo } from 'react';

export const useReportesCalculations = (ventas, tipoReporte) => {
  const safeArray = (arr) => Array.isArray(arr) ? arr : [];

  // Calcular total general
  const totalGeneral = useMemo(() => {
    if (tipoReporte !== 'ventas') {
      return safeArray(ventas).reduce((sum, v) => sum + (v.refundAmount || 0), 0);
    }

    let totalCalculado = 0;
    const ventasProcesadas = new Set();

    safeArray(ventas).forEach(v => {
      if (v.status === 'entregado_y_cobrado' || v.status === 'parcialmente_devuelta') {
        const ventaId = v.ventaId || v._id;

        if (!ventasProcesadas.has(ventaId)) {
          ventasProcesadas.add(ventaId);

          const totalVentaCompleta = v.totalVenta || 0;
          const totalReturnedVenta = v.totalReturned || 0;
          const totalNeto = Math.max(0, totalVentaCompleta - totalReturnedVenta);

          totalCalculado += totalNeto;
        }
      }
    });

    return totalCalculado;
  }, [ventas, tipoReporte]);

  // Calcular IVA total
  const ivaTotal = useMemo(() => {
    if (tipoReporte !== 'ventas') return 0;

    const ventasUnicas = {};
    safeArray(ventas).forEach(v => {
      const ventaId = v.ventaId || v._id;
      if (!ventasUnicas[ventaId] && (v.status === 'entregado_y_cobrado' || v.status === 'parcialmente_devuelta')) {
        const ivaVentaTotal = safeArray(ventas)
          .filter(item => (item.ventaId || item._id) === ventaId)
          .reduce((sum, item) => sum + (item.ivaProducto || 0), 0);

        ventasUnicas[ventaId] = {
          totalVenta: v.totalVenta || 0,
          totalReturned: v.totalReturned || 0,
          ivaTotal: ivaVentaTotal
        };
      }
    });

    return Object.values(ventasUnicas).reduce((sum, venta) => {
      const totalVentaCompleta = venta.totalVenta;
      const totalReturnedVenta = venta.totalReturned || 0;
      const ivaVentaTotal = venta.ivaTotal;

      if (totalReturnedVenta > 0 && totalVentaCompleta > 0) {
        const porcentajeNoDevuelto = (totalVentaCompleta - totalReturnedVenta) / totalVentaCompleta;
        return sum + (ivaVentaTotal * porcentajeNoDevuelto);
      }

      return sum + ivaVentaTotal;
    }, 0);
  }, [ventas, tipoReporte]);

  // Calcular total de registros
  const totalRegistros = useMemo(() => {
    if (tipoReporte !== 'ventas') {
      return safeArray(ventas).length;
    }

    const ventasUnicas = new Set();
    safeArray(ventas).forEach(v => {
      if (v.status === 'entregado_y_cobrado' || v.status === 'parcialmente_devuelta') {
        const totalReturnedVenta = v.totalReturned || 0;
        const totalVentaCompleta = v.totalVenta || 0;

        if (!(totalReturnedVenta > 0 && totalReturnedVenta >= totalVentaCompleta)) {
          ventasUnicas.add(v.ventaId || v._id);
        }
      }
    });
    return ventasUnicas.size;
  }, [ventas, tipoReporte]);

  // Calcular promedio por venta
  const promedioVenta = useMemo(() => {
    return totalRegistros > 0 ? totalGeneral / totalRegistros : 0;
  }, [totalGeneral, totalRegistros]);

  // Generar datos para gráfica
  const generarDatosGrafica = (periodo) => {
    const agrupados = {};

    safeArray(ventas).forEach((venta) => {
      let key = '';
      const fecha = new Date(venta.date);

      if (periodo === 'dia') {
        key = fecha.getHours() + ':00';
      } else if (periodo === 'mes') {
        key = fecha.getDate().toString();
      } else if (periodo === 'año') {
        key = (fecha.getMonth() + 1) + '/' + fecha.getDate();
      }

      if (!agrupados[key]) agrupados[key] = 0;
      agrupados[key] += tipoReporte === 'ventas' ? venta.totalProducto : venta.refundAmount;
    });

    return Object.keys(agrupados).map((key) => ({
      label: key,
      total: agrupados[key],
    }));
  };

  return {
    totalGeneral,
    ivaTotal,
    totalRegistros,
    promedioVenta,
    generarDatosGrafica
  };
};
