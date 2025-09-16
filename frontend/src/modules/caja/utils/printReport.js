export const generatePrintableReport = (resultados, tiendas, formatCurrency, formatDateTime, getTiendaNombre) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Corte de Caja</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 10px;
          line-height: 1.2;
          color: #333;
          background: white;
          padding: 15px;
          max-width: 100%;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #23334e;
          padding-bottom: 8px;
        }
        
        .header h1 {
          font-size: 18px;
          color: #23334e;
          margin-bottom: 3px;
        }
        
        .header h2 {
          font-size: 12px;
          color: #697487;
          font-weight: normal;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
          background: #f8f9fa;
          padding: 8px;
          border-radius: 4px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          font-size: 9px;
        }
        
        .info-label {
          font-weight: bold;
          color: #23334e;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 15px;
        }
        
        .summary-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 8px;
          text-align: center;
        }
        
        .summary-card .icon {
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .summary-card .amount {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .summary-card .label {
          font-size: 8px;
          color: #697487;
          text-transform: uppercase;
        }
        
        .summary-card.positive .amount { color: #10b981; }
        .summary-card.negative .amount { color: #ef4444; }
        .summary-card.warning .amount { color: #f59e0b; }
        .summary-card.info .amount { color: #23334e; }
        
        .breakdown-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .breakdown-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 8px;
        }
        
        .breakdown-card h3 {
          color: #23334e;
          margin-bottom: 8px;
          font-size: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 4px;
        }
        
        .method-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .method-item:last-child {
          border-bottom: none;
        }
        
        .method-info {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .method-icon {
          font-size: 12px;
        }
        
        .method-name {
          font-weight: 500;
          color: #23334e;
          font-size: 9px;
        }
        
        .method-amount {
          font-weight: bold;
          font-size: 9px;
        }
        
        .method-count {
          font-size: 8px;
          color: #697487;
          margin-left: 3px;
        }
        
        .balance-section {
          background: #f8f9fa;
          border: 2px solid #23334e;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 15px;
        }
        
        .balance-title {
          text-align: center;
          color: #23334e;
          font-size: 11px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .balance-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .balance-item {
          text-align: center;
          padding: 6px;
          background: white;
          border-radius: 3px;
        }
        
        .balance-method {
          font-size: 8px;
          color: #697487;
          margin-bottom: 3px;
        }
        
        .balance-amount {
          font-size: 10px;
          font-weight: bold;
        }
        
        .balance-amount.positive { color: #10b981; }
        .balance-amount.negative { color: #ef4444; }
        
        .stats-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          padding: 8px;
          margin-bottom: 10px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .stat-item {
          text-align: center;
          padding: 4px;
        }
        
        .stat-icon {
          font-size: 12px;
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 9px;
          font-weight: bold;
          color: #23334e;
          margin-bottom: 1px;
        }
        
        .stat-label {
          font-size: 7px;
          color: #697487;
        }
        
        .footer {
          margin-top: 15px;
          text-align: center;
          color: #697487;
          font-size: 7px;
          border-top: 1px solid #e5e7eb;
          padding-top: 8px;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          
          body { 
            padding: 5px; 
            font-size: 9px;
            max-height: 100vh;
            overflow: hidden;
          }
          
          .header h1 { 
            font-size: 16px; 
            margin-bottom: 2px;
          }
          
          .header h2 { 
            font-size: 10px; 
          }
          
          .header {
            margin-bottom: 10px;
            padding-bottom: 5px;
          }
          
          .info-section {
            margin-bottom: 10px;
            padding: 5px;
          }
          
          .summary-cards { 
            margin-bottom: 10px;
            gap: 5px;
          }
          
          .breakdown-section { 
            margin-bottom: 10px;
            gap: 8px;
          }
          
          .balance-section {
            margin-bottom: 10px;
            padding: 8px;
          }
          
          .stats-section {
            margin-bottom: 8px;
            padding: 6px;
          }
          
          .stats-grid { 
            grid-template-columns: repeat(4, 1fr);
            gap: 5px;
          }
          
          .footer {
            margin-top: 10px;
            padding-top: 5px;
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
      
      <!-- Información del Período -->
      <div class="info-section">
        <div>
          <div class="info-item">
            <span class="info-label">🏪 Tienda:</span>
            <span>${getTiendaNombre(resultados.periodo?.tiendaId === 'todas' ? '' : resultados.periodo?.tiendaId, tiendas)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📅 Desde:</span>
            <span>${formatDateTime(resultados.periodo?.inicio)}</span>
          </div>
        </div>
        <div>
          <div class="info-item">
            <span class="info-label">🕐 Generado:</span>
            <span>${new Date().toLocaleString('es-MX')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">📅 Hasta:</span>
            <span>${formatDateTime(resultados.periodo?.fin)}</span>
          </div>
        </div>
      </div>
      
      <!-- Resumen Principal -->
      <div class="summary-cards">
        <div class="summary-card positive">
          <div class="icon">💰</div>
          <div class="amount">${formatCurrency(resultados.ventas?.total || 0)}</div>
          <div class="label">Total Ventas</div>
        </div>
        <div class="summary-card negative">
          <div class="icon">📉</div>
          <div class="amount">${formatCurrency(resultados.gastos?.total || 0)}</div>
          <div class="label">Total Gastos</div>
        </div>
        <div class="summary-card warning">
          <div class="icon">🔄</div>
          <div class="amount">${formatCurrency(resultados.devoluciones?.total || 0)}</div>
          <div class="label">Devoluciones</div>
        </div>
        <div class="summary-card info">
          <div class="icon">💎</div>
          <div class="amount">${formatCurrency(resultados.corte?.final || 0)}</div>
          <div class="label">Balance Final</div>
        </div>
      </div>
      
      <!-- Desglose por Método -->
      <div class="breakdown-section">
        <div class="breakdown-card">
          <h3>📈 VENTAS POR MÉTODO DE PAGO</h3>
          ${['efectivo', 'transferencia', 'tarjeta'].map(metodo => `
            <div class="method-item">
              <div class="method-info">
                <span class="method-icon">${getMethodIcon(metodo)}</span>
                <span class="method-name">${metodo.charAt(0).toUpperCase() + metodo.slice(1)}</span>
              </div>
              <div>
                <span class="method-amount" style="color: #10b981;">${formatCurrency(resultados.ventas?.desglose?.[metodo]?.total || 0)}</span>
                <span class="method-count">(${resultados.ventas?.desglose?.[metodo]?.cantidad || 0} trans.)</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="breakdown-card">
          <h3>📉 GASTOS POR MÉTODO DE PAGO</h3>
          ${['efectivo', 'transferencia', 'tarjeta'].map(metodo => `
            <div class="method-item">
              <div class="method-info">
                <span class="method-icon">${getMethodIcon(metodo)}</span>
                <span class="method-name">${metodo.charAt(0).toUpperCase() + metodo.slice(1)}</span>
              </div>
              <div>
                <span class="method-amount" style="color: #ef4444;">${formatCurrency(resultados.gastos?.desglose?.[metodo]?.total || 0)}</span>
                <span class="method-count">(${resultados.gastos?.desglose?.[metodo]?.cantidad || 0} gastos)</span>
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
              <div class="balance-method">${getMethodIcon(metodo)} ${metodo.charAt(0).toUpperCase() + metodo.slice(1)}</div>
              <div class="balance-amount ${(resultados.corte?.porMetodo?.[metodo] || 0) >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(resultados.corte?.porMetodo?.[metodo] || 0)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Estadísticas Adicionales -->
      ${resultados.resumen ? `
        <div class="stats-section">
          <h3 style="margin-bottom: 6px; color: #23334e; font-size: 9px;">📊 ESTADÍSTICAS</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">🛒</div>
              <div class="stat-value">${resultados.resumen.totalTransacciones || 0}</div>
              <div class="stat-label">Transacciones</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📈</div>
              <div class="stat-value">${formatCurrency(resultados.resumen.promedioVenta || 0)}</div>
              <div class="stat-label">Prom. Venta</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">✅</div>
              <div class="stat-value">${resultados.resumen.totalGastosAprobados || 0}</div>
              <div class="stat-label">Gastos</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">💸</div>
              <div class="stat-value">${formatCurrency(resultados.resumen.promedioGasto || 0)}</div>
              <div class="stat-label">Prom. Gasto</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Información de Pagos Mixtos (solo si hay datos significativos) -->
      ${resultados.pagosMixtos && resultados.pagosMixtos.totalVentas > 0 ? `
        <div class="stats-section">
          <h3 style="margin-bottom: 6px; color: #23334e; font-size: 9px;">🔀 PAGOS MIXTOS</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-icon">🔀</div>
              <div class="stat-value">${resultados.pagosMixtos.totalVentas}</div>
              <div class="stat-label">Ventas</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">💰</div>
              <div class="stat-value">${formatCurrency(resultados.pagosMixtos.montoTotal)}</div>
              <div class="stat-label">Monto</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">⚖️</div>
              <div class="stat-value">${resultados.pagosMixtos.promedioMetodos}</div>
              <div class="stat-label">Métodos/Venta</div>
            </div>
            <div class="stat-item">
              <div class="stat-icon">📊</div>
              <div class="stat-value">${resultados.pagosMixtos.porcentajeDelTotal}%</div>
              <div class="stat-label">% Total</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <!-- Footer -->
      <div class="footer">
        <p>📄 Reporte generado automáticamente por el Sistema POS</p>
        <p>🕐 Fecha y hora de generación: ${new Date().toLocaleString('es-MX')}</p>
        <p>🔒 Este documento es confidencial y de uso interno exclusivo</p>
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
  
  // Auto-print after content loads
  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  return printWindow;
};