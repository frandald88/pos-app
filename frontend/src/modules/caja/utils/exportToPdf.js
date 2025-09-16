// Función para exportar el corte de caja a PDF sin dependencias externas
export const exportToPDF = (resultados, tiendas, formatCurrency, formatDateTime, getTiendaNombre) => {
  // Crear una nueva ventana con el contenido del reporte
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Corte de Caja - ${formatDateTime(new Date())}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 9px;
          line-height: 1.1;
          color: #333;
          background: white;
          padding: 12px;
          max-width: 100%;
        }
        
        .header {
          text-align: center;
          margin-bottom: 12px;
          border-bottom: 2px solid #23334e;
          padding-bottom: 6px;
        }
        
        .header h1 {
          font-size: 16px;
          color: #23334e;
          margin-bottom: 3px;
        }
        
        .header h2 {
          font-size: 11px;
          color: #697487;
          font-weight: normal;
        }
        
        .report-info {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 3px;
          margin-bottom: 12px;
          border: 1px solid #e9ecef;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 1px 0;
          font-size: 8px;
        }
        
        .info-label {
          font-weight: bold;
          color: #23334e;
        }
        
        .summary-section {
          margin-bottom: 12px;
        }
        
        .summary-title {
          font-size: 10px;
          font-weight: bold;
          color: #23334e;
          margin-bottom: 6px;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 3px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        
        .summary-item {
          text-align: center;
          padding: 6px;
          border: 1px solid #e9ecef;
          border-radius: 3px;
          background: white;
        }
        
        .summary-amount {
          font-size: 10px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .summary-label {
          font-size: 7px;
          color: #697487;
          text-transform: uppercase;
        }
        
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        
        .breakdown-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        
        .breakdown-card {
          border: 1px solid #e9ecef;
          border-radius: 3px;
          padding: 8px;
        }
        
        .breakdown-title {
          font-size: 9px;
          font-weight: bold;
          color: #23334e;
          margin-bottom: 6px;
          border-bottom: 1px solid #e9ecef;
          padding-bottom: 3px;
        }
        
        .method-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 3px 0;
          border-bottom: 1px solid #f8f9fa;
        }
        
        .method-row:last-child {
          border-bottom: none;
        }
        
        .method-name {
          font-weight: 500;
          text-transform: capitalize;
          font-size: 8px;
        }
        
        .method-details {
          text-align: right;
        }
        
        .method-amount {
          font-weight: bold;
          font-size: 8px;
        }
        
        .method-count {
          font-size: 7px;
          color: #697487;
        }
        
        .balance-section {
          background: #f8f9fa;
          border: 2px solid #23334e;
          border-radius: 3px;
          padding: 10px;
          margin-bottom: 12px;
        }
        
        .balance-title {
          text-align: center;
          font-size: 10px;
          font-weight: bold;
          color: #23334e;
          margin-bottom: 6px;
        }
        
        .balance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        
        .balance-item {
          text-align: center;
          padding: 5px;
          background: white;
          border-radius: 2px;
          border: 1px solid #e9ecef;
        }
        
        .balance-method {
          font-size: 7px;
          color: #697487;
          margin-bottom: 2px;
          text-transform: capitalize;
        }
        
        .balance-amount {
          font-size: 8px;
          font-weight: bold;
        }
        
        .stats-section {
          border: 1px solid #e9ecef;
          border-radius: 3px;
          padding: 8px;
          margin-bottom: 10px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }
        
        .stat-item {
          text-align: center;
          padding: 4px;
        }
        
        .stat-value {
          font-size: 8px;
          font-weight: bold;
          color: #23334e;
          margin-bottom: 1px;
        }
        
        .stat-label {
          font-size: 6px;
          color: #697487;
        }
        
        .footer {
          margin-top: 15px;
          text-align: center;
          color: #697487;
          font-size: 7px;
          border-top: 1px solid #e9ecef;
          padding-top: 6px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 0.4in;
          }
          
          body { 
            padding: 8px; 
            font-size: 8px;
            max-height: 100vh;
            overflow: hidden;
          }
          
          .header h1 { 
            font-size: 14px;
            margin-bottom: 2px;
          }
          
          .header h2 { 
            font-size: 10px; 
          }
          
          .header {
            margin-bottom: 8px;
            padding-bottom: 4px;
          }
          
          .report-info {
            margin-bottom: 8px;
            padding: 6px;
          }
          
          .summary-section {
            margin-bottom: 8px;
          }
          
          .breakdown-section {
            margin-bottom: 8px;
            gap: 8px;
          }
          
          .balance-section {
            margin-bottom: 8px;
            padding: 8px;
          }
          
          .stats-section {
            margin-bottom: 6px;
            padding: 6px;
          }
          
          .footer {
            margin-top: 8px;
            padding-top: 4px;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>📊 REPORTE DE CORTE DE CAJA</h1>
        <h2>Sistema de Punto de Venta</h2>
      </div>
      
      <!-- Información del Reporte -->
      <div class="report-info">
        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">🏪 Tienda:</span>
              <span>${getTiendaNombre(resultados.periodo?.tiendaId === 'todas' ? '' : resultados.periodo?.tiendaId, tiendas)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📅 Período Desde:</span>
              <span>${formatDateTime(resultados.periodo?.inicio)}</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">🕐 Generado:</span>
              <span>${new Date().toLocaleString('es-MX')}</span>
            </div>
            <div class="info-item">
              <span class="info-label">📅 Período Hasta:</span>
              <span>${formatDateTime(resultados.periodo?.fin)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Resumen Principal -->
      <div class="summary-section">
        <div class="summary-title">💰 RESUMEN FINANCIERO</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-amount positive">${formatCurrency(resultados.ventas?.total || 0)}</div>
            <div class="summary-label">Total Ventas</div>
          </div>
          <div class="summary-item">
            <div class="summary-amount negative">${formatCurrency(resultados.gastos?.total || 0)}</div>
            <div class="summary-label">Total Gastos</div>
          </div>
          <div class="summary-item">
            <div class="summary-amount warning">${formatCurrency(resultados.devoluciones?.total || 0)}</div>
            <div class="summary-label">Devoluciones</div>
          </div>
          <div class="summary-item">
            <div class="summary-amount info">${formatCurrency(resultados.corte?.final || 0)}</div>
            <div class="summary-label">Balance Final</div>
          </div>
        </div>
      </div>
      
      <!-- Desglose por Método -->
      <div class="breakdown-section">
        <div class="breakdown-card">
          <div class="breakdown-title">📈 VENTAS POR MÉTODO DE PAGO</div>
          ${['efectivo', 'transferencia', 'tarjeta'].map(metodo => `
            <div class="method-row">
              <span class="method-name">${getMethodIcon(metodo)} ${metodo}</span>
              <div class="method-details">
                <div class="method-amount positive">${formatCurrency(resultados.ventas?.desglose?.[metodo]?.total || 0)}</div>
                <div class="method-count">(${resultados.ventas?.desglose?.[metodo]?.cantidad || 0} transacciones)</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="breakdown-card">
          <div class="breakdown-title">📉 GASTOS POR MÉTODO DE PAGO</div>
          ${['efectivo', 'transferencia', 'tarjeta'].map(metodo => `
            <div class="method-row">
              <span class="method-name">${getMethodIcon(metodo)} ${metodo}</span>
              <div class="method-details">
                <div class="method-amount negative">${formatCurrency(resultados.gastos?.desglose?.[metodo]?.total || 0)}</div>
                <div class="method-count">(${resultados.gastos?.desglose?.[metodo]?.cantidad || 0} gastos)</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Balance por Método -->
      <div class="balance-section">
        <div class="balance-title">⚖️ BALANCE NETO POR MÉTODO DE PAGO</div>
        <div class="balance-grid">
          ${['efectivo', 'transferencia', 'tarjeta'].map(metodo => `
            <div class="balance-item">
              <div class="balance-method">${getMethodIcon(metodo)} ${metodo}</div>
              <div class="balance-amount ${(resultados.corte?.porMetodo?.[metodo] || 0) >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(resultados.corte?.porMetodo?.[metodo] || 0)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Estadísticas del Período -->
      ${resultados.resumen ? `
        <div class="stats-section">
          <div class="summary-title">📊 ESTADÍSTICAS DEL PERÍODO</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${resultados.resumen.totalTransacciones || 0}</div>
              <div class="stat-label">Total Transacciones</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatCurrency(resultados.resumen.promedioVenta || 0)}</div>
              <div class="stat-label">Promedio por Venta</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${resultados.resumen.totalGastosAprobados || 0}</div>
              <div class="stat-label">Gastos Aprobados</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatCurrency(resultados.resumen.promedioGasto || 0)}</div>
              <div class="stat-label">Promedio por Gasto</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Información de Pagos Mixtos -->
      ${resultados.pagosMixtos && resultados.pagosMixtos.totalVentas > 0 ? `
        <div class="stats-section">
          <div class="summary-title">🔀 ANÁLISIS DE PAGOS MIXTOS</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${resultados.pagosMixtos.totalVentas}</div>
              <div class="stat-label">Ventas Mixtas</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatCurrency(resultados.pagosMixtos.montoTotal)}</div>
              <div class="stat-label">Monto Total Mixto</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${resultados.pagosMixtos.promedioMetodos}</div>
              <div class="stat-label">Métodos por Venta</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${resultados.pagosMixtos.porcentajeDelTotal}%</div>
              <div class="stat-label">% del Total de Ventas</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="footer">
        <p><strong>📄 Reporte de Corte de Caja</strong></p>
        <p>🕐 Generado el: ${new Date().toLocaleString('es-MX')}</p>
        <p>🔒 Documento confidencial - Sistema POS</p>
      </div>
    </body>
    </html>
  `;
  
  // Helper function for method icons
  function getMethodIcon(metodo) {
    const icons = {
      'efectivo': '💵',
      'transferencia': '🏦',
      'tarjeta': '💳'
    };
    return icons[metodo] || '💰';
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Configurar para guardar como PDF
  printWindow.onload = function() {
    setTimeout(() => {
      // Cambiar el título del documento
      printWindow.document.title = `Corte-Caja-${new Date().toISOString().slice(0, 10)}`;
      
      // Abrir diálogo de impresión/guardar como PDF
      printWindow.print();
      
      // Mensaje informativo
      console.log('💡 Para guardar como PDF: En el diálogo de impresión, selecciona "Guardar como PDF" como destino');
    }, 500);
  };
  
  return printWindow;
};