export const generatePrintableReport = (resultados, tiendas, formatCurrency, formatDateTime, getTiendaNombre) => {
  const printWindow = window.open('', '_blank');

  // Obtener información de la tienda
  const tiendaNombre = getTiendaNombre(resultados.periodo?.tiendaId === 'todas' ? '' : resultados.periodo?.tiendaId, tiendas);
  const tienda = tiendas.find(t => t._id === resultados.periodo?.tiendaId);

  // Calcular totales y estadísticas
  const totalVentas = resultados.ventas?.total || 0;
  const totalGastos = resultados.gastos?.total || 0;
  const totalDevoluciones = resultados.devoluciones?.total || 0;

  const ventasEfectivo = resultados.ventas?.desglose?.efectivo?.total || 0;
  const ventasTransferencia = resultados.ventas?.desglose?.transferencia?.total || 0;
  const ventasTarjeta = resultados.ventas?.desglose?.tarjeta?.total || 0;

  const gastosEfectivo = resultados.gastos?.desglose?.efectivo?.total || 0;
  const gastosTransferencia = resultados.gastos?.desglose?.transferencia?.total || 0;
  const gastosTarjeta = resultados.gastos?.desglose?.tarjeta?.total || 0;

  const balanceEfectivo = (resultados.corte?.porMetodo?.efectivo || 0);
  const balanceTransferencia = (resultados.corte?.porMetodo?.transferencia || 0);
  const balanceTarjeta = (resultados.corte?.porMetodo?.tarjeta || 0);

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Corte de Caja</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: 80mm auto;
          margin: 0;
        }

        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: white;
          width: 80mm;
          padding: 5mm;
        }

        .center {
          text-align: center;
        }

        .separator {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }

        .separator-double {
          border-top: 2px solid #000;
          margin: 8px 0;
        }

        .line-item {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }

        .bold {
          font-weight: bold;
        }

        .title {
          font-size: 14px;
          font-weight: bold;
          margin: 5px 0;
        }

        .section-title {
          font-weight: bold;
          margin: 8px 0 4px 0;
          text-align: center;
        }

        .indent {
          padding-left: 10px;
        }

        @media print {
          body {
            width: 80mm;
          }

          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="center separator-double">
        <div class="bold">${tienda?.nombre || 'NOMBRE DEL NEGOCIO'}</div>
        <div>${tienda?.direccion || 'Dirección del negocio'}</div>
        <div>${tienda?.telefono || 'Teléfono'}</div>
      </div>
      <div class="separator-double"></div>

      <div class="center title">CORTE DE CAJA</div>
      <div class="line-item">
        <span>DEL</span>
        <span>${formatDateTime(resultados.periodo?.inicio)}</span>
      </div>
      <div class="line-item">
        <span>AL</span>
        <span>${formatDateTime(resultados.periodo?.fin)}</span>
      </div>
      <div class="line-item">
        <span>TIENDA:</span>
        <span>${tiendaNombre}</span>
      </div>

      <div class="separator"></div>

      <!-- Resumen de efectivo -->
      <div class="line-item">
        <span>- EFECTIVO INICIAL:</span>
        <span>${formatCurrency(0)}</span>
      </div>
      <div class="line-item">
        <span>- EFECTIVO FINAL:</span>
        <span>${formatCurrency(balanceEfectivo)}</span>
      </div>
      <div class="line-item">
        <span>- TARJETA:</span>
        <span>${formatCurrency(balanceTarjeta)}</span>
      </div>
      <div class="line-item">
        <span>- TRANSFERENCIA:</span>
        <span>${formatCurrency(balanceTransferencia)}</span>
      </div>

      <div class="separator"></div>

      <div class="line-item bold">
        <span>= SALDO FINAL:</span>
        <span>${formatCurrency(resultados.corte?.final || 0)}</span>
      </div>
      <div class="line-item indent">
        <span>EFECTIVO FINAL:</span>
        <span>${formatCurrency(balanceEfectivo)}</span>
      </div>

      <div class="separator"></div>

      <!-- Forma de pago ventas -->
      <div class="section-title">FORMA DE PAGO VENTAS</div>
      <div class="separator"></div>

      <div class="line-item">
        <span>EFECTIVO</span>
        <span>${formatCurrency(ventasEfectivo)}</span>
      </div>
      <div class="line-item">
        <span>TRANSFERENCIA</span>
        <span>${formatCurrency(ventasTransferencia)}</span>
      </div>
      <div class="line-item">
        <span>TARJETA</span>
        <span>${formatCurrency(ventasTarjeta)}</span>
      </div>

      <div class="separator"></div>

      <!-- Ventas sin impuestos -->
      <div class="section-title">===== VENTA (NO INCLUYE IMPUESTOS) =====</div>

      <div class="separator"></div>
      <div class="line-item">
        <span>SUBTOTAL</span>
        <span>${formatCurrency(totalVentas)}</span>
      </div>
      <div class="line-item">
        <span>-DESCUENTOS</span>
        <span>${formatCurrency(0)}</span>
      </div>
      <div class="line-item bold">
        <span>VENTA NETA</span>
        <span>${formatCurrency(totalVentas)}</span>
      </div>

      <div class="separator"></div>

      <div class="line-item bold">
        <span>VENTAS CON IMP.:</span>
        <span>${formatCurrency(totalVentas)}</span>
      </div>

      <div class="separator"></div>

      <!-- Estadísticas -->
      <div class="line-item">
        <span>VENTAS NORMALES</span>
        <span>: ${resultados.ventas?.desglose?.efectivo?.cantidad || 0 + resultados.ventas?.desglose?.transferencia?.cantidad || 0 + resultados.ventas?.desglose?.tarjeta?.cantidad || 0}</span>
      </div>
      <div class="line-item">
        <span>VENTAS CANCELADAS</span>
        <span>: 0</span>
      </div>
      <div class="line-item">
        <span>VENTAS CON DESCUENTO</span>
        <span>: 0</span>
      </div>
      <div class="line-item">
        <span>CONSUMO PROMEDIO</span>
        <span>: ${formatCurrency(resultados.resumen?.promedioVenta || 0)}</span>
      </div>
      <div class="line-item">
        <span>NUMERO DE VENTAS</span>
        <span>: ${resultados.resumen?.totalTransacciones || 0}</span>
      </div>
      <div class="line-item">
        <span>PROPINAS</span>
        <span>: ${formatCurrency(0)}</span>
      </div>
      <div class="line-item">
        <span>DESCUENTO MONETARIO</span>
        <span>: ${formatCurrency(0)}</span>
      </div>

      <div class="separator"></div>

      <div class="line-item bold">
        <span>TOTAL DESCUENTOS</span>
        <span>: ${formatCurrency(0)}</span>
      </div>

      <div class="separator"></div>

      <!-- Totales por método -->
      <div class="line-item">
        <span>EFECTIVO:</span>
        <span>${formatCurrency(ventasEfectivo)}</span>
      </div>
      <div class="line-item">
        <span>TARJETA:</span>
        <span>${formatCurrency(ventasTarjeta)}</span>
      </div>
      <div class="line-item">
        <span>TRANSFERENCIA:</span>
        <span>${formatCurrency(ventasTransferencia)}</span>
      </div>

      <div class="separator"></div>

      <div class="line-item bold">
        <span>TOTAL:</span>
        <span>${formatCurrency(totalVentas)}</span>
      </div>
      <div class="line-item bold">
        <span>SOBRANTE(+) O FALTANTE(-):</span>
        <span>${formatCurrency(0)}</span>
      </div>

      <div class="separator-double"></div>

      <div class="center">
        <div>Reporte generado</div>
        <div>${new Date().toLocaleString('es-MX')}</div>
      </div>

      <div class="separator-double"></div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();

  // Auto-print after content loads
  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return printWindow;
};
