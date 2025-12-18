import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PrintService from '../services/printService';

/**
 * Componente para imprimir comanda de cocina
 * Formato optimizado para impresoras térmicas de 80mm
 * Enfocado en mostrar información para preparar alimentos
 */
export default function PrintComanda({ sale, onClose }) {
  const comandaRef = useRef();

  const handlePrintDialog = useReactToPrint({
    content: () => comandaRef.current,
    documentTitle: `Comanda-${sale.folio || sale._id}`,
    onAfterPrint: () => {
      console.log('✅ Comanda impresa');
      if (onClose) onClose();
    },
  });

  // Manejar impresión (directa o con diálogo)
  const handlePrint = async () => {
    console.log('🖨️ Iniciando impresión de comanda...');

    // Preparar configuración de la tienda
    const storeConfig = {
      printConfig: sale.tienda?.printConfig || { directPrint: false },
      ticketConfig: sale.tienda?.ticketConfig || {}
    };

    try {
      // Intentar impresión directa si está habilitada, sino usar diálogo
      const result = await PrintService.printComanda(sale, storeConfig, handlePrintDialog);
      console.log('📄 Resultado de impresión de comanda:', result);

      // Solo cerrar el modal si se imprimió correctamente
      if (result.success && result.method === 'direct' && onClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Error al imprimir comanda:', error);
      // En caso de error, intentar con el diálogo como último recurso
      handlePrintDialog();
    }
  };

  // Formatear fecha y hora
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener nombre del tipo de venta
  const getTipoVentaNombre = (tipo) => {
    const tipos = {
      'mostrador': 'MOSTRADOR',
      'domicilio': 'DOMICILIO',
      'recoger': 'A RECOGER'
    };
    return tipos[tipo] || tipo?.toUpperCase();
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Botones de acción */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#23334e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          🖨️ Imprimir Comanda
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Vista previa de la comanda */}
      <div
        ref={comandaRef}
        style={{
          width: '80mm',
          margin: '0 auto',
          padding: '10mm',
          backgroundColor: 'white',
          fontFamily: 'Courier New, monospace',
          fontSize: '14px',
          color: 'black',
        }}
      >
        {/* Encabezado - COMANDA DE COCINA */}
        <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '15px' }}>
          <h1 style={{ margin: '5px 0', fontSize: '24px', fontWeight: 'bold' }}>
            COMANDA
          </h1>
          <h2 style={{ margin: '5px 0', fontSize: '18px' }}>
            {sale.tienda?.nombre || 'COCINA'}
          </h2>
        </div>

        {/* Información principal */}
        <div style={{ marginBottom: '15px', fontSize: '13px', backgroundColor: '#f5f5f5', padding: '10px', border: '2px solid #000' }}>
          {/* Folio - Grande y destacado */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>ORDEN #</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '2px' }}>
              {sale.folio || sale._id?.substring(0, 8).toUpperCase()}
            </div>
            {/* ID de Venta para devoluciones */}
            <div style={{ fontSize: '9px', color: '#666', marginTop: '5px' }}>
              ID: {sale._id}
            </div>
          </div>

          {/* Tipo de venta - Destacado */}
          <div style={{
            textAlign: 'center',
            padding: '8px',
            backgroundColor: sale.tipo === 'domicilio' ? '#ff6b6b' : sale.tipo === 'recoger' ? '#4ecdc4' : '#95e1d3',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '16px',
            marginBottom: '10px',
            border: '2px solid #000'
          }}>
            {getTipoVentaNombre(sale.tipo)}
          </div>

          {/* Fecha y hora */}
          <p style={{ margin: '5px 0', textAlign: 'center', fontSize: '12px' }}>
            <strong>{formatDateTime(sale.fecha || new Date())}</strong>
          </p>

          {/* Cliente */}
          {sale.cliente && (
            <p style={{ margin: '8px 0', fontSize: '14px', textAlign: 'center', borderTop: '1px dashed #666', paddingTop: '8px' }}>
              <strong>Cliente:</strong> {sale.cliente.nombre || sale.cliente}
            </p>
          )}

          {/* Usuario que registró */}
          <p style={{ margin: '5px 0', fontSize: '11px', textAlign: 'center', color: '#666' }}>
            Registrado por: {sale.usuario?.nombre || sale.usuario?.username || 'N/A'}
          </p>
        </div>

        {/* Línea divisoria gruesa */}
        <div style={{ borderBottom: '3px double #000', margin: '15px 0' }}></div>

        {/* Título de productos */}
        <div style={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '8px',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          PRODUCTOS A PREPARAR
        </div>

        {/* Lista de productos */}
        <div style={{ marginBottom: '15px' }}>
          {sale.items?.map((item, index) => (
            <div
              key={index}
              style={{
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
                border: '1px solid #ccc',
                borderLeft: '4px solid #23334e'
              }}
            >
              {/* Cantidad y nombre del producto */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '5px'
              }}>
                <div style={{
                  backgroundColor: '#23334e',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  {item.cantidad}x
                </div>
                <div style={{
                  flex: 1,
                  marginLeft: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {item.producto?.nombre || item.nombre}
                </div>
              </div>

              {/* Notas o modificaciones */}
              {item.notas && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#fff3cd',
                  border: '2px dashed #856404',
                  borderRadius: '4px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#856404', marginBottom: '4px' }}>
                    ⚠️ NOTA ESPECIAL:
                  </div>
                  <div style={{ fontSize: '13px', color: '#000', fontStyle: 'italic' }}>
                    {item.notas}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Línea divisoria */}
        <div style={{ borderBottom: '3px double #000', margin: '15px 0' }}></div>

        {/* Resumen */}
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <p style={{ margin: '5px 0' }}>
            Total de productos: <strong>{sale.items?.reduce((sum, item) => sum + item.cantidad, 0)}</strong>
          </p>
          <p style={{ margin: '5px 0' }}>
            Artículos diferentes: <strong>{sale.items?.length}</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '11px',
          borderTop: '2px dashed #000',
          paddingTop: '10px'
        }}>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
            ¡PREPARAR CON CUIDADO!
          </p>
          <p style={{ margin: '10px 0', fontSize: '10px', color: '#666' }}>
            Hora de impresión: {new Date().toLocaleTimeString('es-MX')}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook personalizado para imprimir comandas
 * Uso:
 * const { printComanda } = usePrintComanda();
 * printComanda(saleData);
 */
export function usePrintComanda() {
  const printComanda = (sale) => {
    const getTipoVentaNombre = (tipo) => {
      const tipos = {
        'mostrador': 'MOSTRADOR',
        'domicilio': 'DOMICILIO',
        'recoger': 'A RECOGER'
      };
      return tipos[tipo] || tipo?.toUpperCase();
    };

    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getTipoColor = (tipo) => {
      if (tipo === 'domicilio') return '#ff6b6b';
      if (tipo === 'recoger') return '#4ecdc4';
      return '#95e1d3';
    };

    // Crear ventana temporal para imprimir
    const printWindow = window.open('', '', 'width=800,height=600');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda - ${sale.folio || sale._id}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              width: 80mm;
              margin: 0 auto;
              padding: 5mm;
              font-size: 14px;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .info-box {
              background-color: #f5f5f5;
              padding: 10px;
              border: 2px solid #000;
              margin-bottom: 15px;
            }
            .folio {
              text-align: center;
              font-size: 28px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 10px 0;
            }
            .tipo-venta {
              text-align: center;
              padding: 8px;
              background-color: ${getTipoColor(sale.tipo)};
              color: #000;
              font-weight: bold;
              font-size: 16px;
              border: 2px solid #000;
              margin: 10px 0;
            }
            .product-item {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ccc;
              border-left: 4px solid #23334e;
            }
            .product-header {
              display: flex;
              align-items: center;
              margin-bottom: 5px;
            }
            .cantidad-badge {
              background-color: #23334e;
              color: #fff;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 18px;
              font-weight: bold;
              min-width: 50px;
              text-align: center;
            }
            .product-name {
              flex: 1;
              margin-left: 10px;
              font-size: 16px;
              font-weight: bold;
            }
            .notas {
              margin-top: 8px;
              padding: 8px;
              background-color: #fff3cd;
              border: 2px dashed #856404;
              border-radius: 4px;
            }
            .line { border-bottom: 3px double #000; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 5px 0; font-size: 24px;">COMANDA</h1>
            <h2 style="margin: 5px 0; font-size: 18px;">${sale.tienda?.nombre || 'COCINA'}</h2>
          </div>

          <div class="info-box">
            <div style="text-align: center; font-size: 12px; color: #666;">ORDEN #</div>
            <div class="folio">${sale.folio || sale._id?.substring(0, 8).toUpperCase()}</div>

            <div class="tipo-venta">${getTipoVentaNombre(sale.tipo)}</div>

            <p style="text-align: center; font-size: 12px; margin: 5px 0;">
              <strong>${formatDateTime(sale.fecha || new Date())}</strong>
            </p>

            ${sale.cliente ? `
              <p style="text-align: center; font-size: 14px; border-top: 1px dashed #666; padding-top: 8px; margin: 8px 0;">
                <strong>Cliente:</strong> ${sale.cliente.nombre || sale.cliente}
              </p>
            ` : ''}

            <p style="text-align: center; font-size: 11px; color: #666; margin: 5px 0;">
              Registrado por: ${sale.usuario?.nombre || sale.usuario?.username || 'N/A'}
            </p>
          </div>

          <div class="line"></div>

          <div style="background-color: #000; color: #fff; padding: 8px; text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 10px;">
            PRODUCTOS A PREPARAR
          </div>

          ${sale.items?.map((item, index) => `
            <div class="product-item" style="background-color: ${index % 2 === 0 ? '#f9f9f9' : '#fff'};">
              <div class="product-header">
                <div class="cantidad-badge">${item.cantidad}x</div>
                <div class="product-name">${item.producto?.nombre || item.nombre}</div>
              </div>
              ${item.notas ? `
                <div class="notas">
                  <div style="font-size: 11px; font-weight: bold; color: #856404; margin-bottom: 4px;">
                    ⚠️ NOTA ESPECIAL:
                  </div>
                  <div style="font-size: 13px; color: #000; font-style: italic;">
                    ${item.notas}
                  </div>
                </div>
              ` : ''}
            </div>
          `).join('')}

          <div class="line"></div>

          <div style="text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 5px 0;">
              Total de productos: <strong>${sale.items?.reduce((sum, item) => sum + item.cantidad, 0)}</strong>
            </p>
            <p style="margin: 5px 0;">
              Artículos diferentes: <strong>${sale.items?.length}</strong>
            </p>
          </div>

          <div style="margin-top: 20px; text-align: center; border-top: 2px dashed #000; padding-top: 10px; font-size: 11px;">
            <p style="margin: 5px 0; font-weight: bold;">¡PREPARAR CON CUIDADO!</p>
            <p style="margin: 10px 0; font-size: 10px; color: #666;">
              Hora de impresión: ${new Date().toLocaleTimeString('es-MX')}
            </p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return { printComanda };
}
