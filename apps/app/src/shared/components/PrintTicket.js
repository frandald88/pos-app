import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';

/**
 * Componente para imprimir tickets de venta
 * Formato optimizado para impresoras térmicas de 80mm
 */
export default function PrintTicket({ sale, onClose }) {
  const ticketRef = useRef();

  // Obtener configuración del ticket de la tienda
  const config = sale.tienda?.ticketConfig || {};

  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: `Ticket-${sale.folio || sale._id}`,
    onAfterPrint: () => {
      console.log('✅ Ticket impreso');
      if (onClose) onClose();
    },
  });

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear hora
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Formatear dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  // Obtener configuración de campos a mostrar (valores por defecto si no existe config)
  const camposMostrar = config.camposMostrar || {
    folio: true,
    fecha: true,
    hora: true,
    cajero: true,
    cliente: true,
    metodoPago: true,
    subtotal: true,
    descuento: true,
    iva: false,
    propina: false,
    cambio: true
  };

  // Obtener tamaño de fuente
  const getFontSize = () => {
    const sizes = { small: '10px', normal: '12px', large: '14px' };
    return sizes[config.tamanoFuente] || '12px';
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
          🖨️ Imprimir
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

      {/* Vista previa del ticket */}
      <div
        ref={ticketRef}
        style={{
          width: config.anchoTicket || '80mm',
          margin: '0 auto',
          padding: '10mm',
          backgroundColor: 'white',
          fontFamily: 'Courier New, monospace',
          fontSize: getFontSize(),
          color: 'black',
        }}
      >
        {/* Encabezado */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '10px', marginBottom: '10px' }}>
          {/* Logo */}
          {config.mostrarLogo && config.logo && (
            <img
              src={config.logo}
              alt="Logo"
              style={{ maxWidth: '60mm', height: 'auto', marginBottom: '10px' }}
            />
          )}

          <h2 style={{ margin: '5px 0', fontSize: '18px' }}>
            {config.nombreNegocio || sale.tienda?.nombre || 'RESTAURANTE'}
          </h2>
          <p style={{ margin: '2px 0', fontSize: '11px' }}>
            {sale.tienda?.direccion || 'Dirección del negocio'}
          </p>
          <p style={{ margin: '2px 0', fontSize: '11px' }}>
            Tel: {sale.tienda?.telefono || '(XXX) XXX-XXXX'}
          </p>
          {config.mostrarRFC && config.rfc && (
            <p style={{ margin: '2px 0', fontSize: '11px' }}>
              RFC: {config.rfc}
            </p>
          )}

          {/* Mensaje superior */}
          {config.mensajeSuperior && (
            <p style={{ margin: '10px 0 0 0', fontSize: '11px', whiteSpace: 'pre-line' }}>
              {config.mensajeSuperior}
            </p>
          )}

          {/* Campos personalizados - header */}
          {config.camposPersonalizados?.filter(c => c.posicion === 'header').map((campo, idx) => (
            <p key={idx} style={{ margin: '2px 0', fontSize: '10px' }}>
              <strong>{campo.nombre}:</strong> {campo.valor}
            </p>
          ))}
        </div>

        {/* Información de venta */}
        <div style={{ marginBottom: '10px', fontSize: '11px' }}>
          {camposMostrar.folio && (
            <p style={{ margin: '2px 0' }}>
              <strong>Folio:</strong> {sale.folio || sale._id?.substring(0, 8).toUpperCase()}
            </p>
          )}
          {/* ID de Venta para devoluciones */}
          <p style={{ margin: '2px 0', fontSize: '10px', color: '#555' }}>
            <strong>ID Venta:</strong> {sale._id}
          </p>
          {camposMostrar.fecha && (
            <p style={{ margin: '2px 0' }}>
              <strong>Fecha:</strong> {new Date(sale.fecha || new Date()).toLocaleDateString('es-MX')}
            </p>
          )}
          {camposMostrar.hora && (
            <p style={{ margin: '2px 0' }}>
              <strong>Hora:</strong> {formatTime(sale.fecha || new Date())}
            </p>
          )}
          {camposMostrar.cajero && (
            <p style={{ margin: '2px 0' }}>
              <strong>Cajero:</strong> {sale.usuario?.username || sale.usuario?.nombre || 'N/A'}
            </p>
          )}
          {camposMostrar.cliente && sale.cliente && (
            <>
              <p style={{ margin: '2px 0' }}>
                <strong>Cliente:</strong> {sale.cliente.nombre}
              </p>
              {/* DEBUG: Verificar tipo de venta y dirección */}
              {(() => {
                console.log('🔍 DEBUG TICKET:');
                console.log('- Tipo de venta (type):', sale.type);
                console.log('- Tipo de venta (tipo):', sale.tipo);
                console.log('- Cliente completo:', sale.cliente);
                console.log('- Dirección del cliente:', sale.cliente.direccion);
                console.log('- ¿Es domicilio?:', (sale.type === 'domicilio' || sale.tipo === 'domicilio'));
                console.log('- ¿Tiene dirección?:', !!sale.cliente.direccion);
                return null;
              })()}
              {/* Mostrar dirección solo para ventas a domicilio */}
              {(sale.type === 'domicilio' || sale.tipo === 'domicilio') && sale.cliente.direccion && (
                <p style={{ margin: '2px 0', fontSize: '11px' }}>
                  <strong>Dirección:</strong> {sale.cliente.direccion}
                </p>
              )}
            </>
          )}
        </div>

        {/* Línea divisoria */}
        <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>

        {/* Productos */}
        <div style={{ marginBottom: '10px' }}>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '5px 0' }}>CANT</th>
                <th style={{ textAlign: 'left', padding: '5px 0' }}>DESCRIPCIÓN</th>
                <th style={{ textAlign: 'right', padding: '5px 0' }}>PRECIO</th>
                <th style={{ textAlign: 'right', padding: '5px 0' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: '5px 0' }}>{item.cantidad}</td>
                  <td style={{ padding: '5px 0' }}>
                    {item.producto?.nombre || item.nombre}
                    {item.notas && (
                      <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                        {item.notas}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 0' }}>
                    {formatMoney(item.precio)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '5px 0' }}>
                    <strong>{formatMoney(item.cantidad * item.precio)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Línea divisoria */}
        <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>

        {/* Totales */}
        <div style={{ fontSize: '12px', marginBottom: '10px' }}>
          {camposMostrar.subtotal && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>Subtotal:</span>
              <span>{formatMoney(sale.subtotal || sale.total)}</span>
            </div>
          )}

          {camposMostrar.descuento && sale.descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0', color: '#d9534f' }}>
              <span>Descuento:</span>
              <span>-{formatMoney(sale.descuento)}</span>
            </div>
          )}

          {camposMostrar.iva && sale.iva > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>IVA:</span>
              <span>{formatMoney(sale.iva)}</span>
            </div>
          )}

          {camposMostrar.propina && sale.propina > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '5px 0' }}>
              <span>Propina:</span>
              <span>{formatMoney(sale.propina)}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '10px 0',
              paddingTop: '10px',
              borderTop: '2px solid #000',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            <span>TOTAL:</span>
            <span>{formatMoney(sale.total)}</span>
          </div>

          {/* Método de pago */}
          {camposMostrar.metodoPago && (
            <div style={{ marginTop: '10px', fontSize: '11px' }}>
              <p style={{ margin: '2px 0' }}>
                <strong>Método de pago:</strong> {sale.metodoPago || 'Efectivo'}
              </p>
              {camposMostrar.cambio && sale.pagoCon && sale.metodoPago === 'Efectivo' && (
                <>
                  <p style={{ margin: '2px 0' }}>
                    <strong>Pago con:</strong> {formatMoney(sale.pagoCon)}
                  </p>
                  <p style={{ margin: '2px 0' }}>
                    <strong>Cambio:</strong> {formatMoney(sale.pagoCon - sale.total)}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Línea divisoria */}
        <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '10px' }}>
          {/* Código de barras */}
          {sale._id && (
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <Barcode
                value={sale.folio || sale._id?.substring(0, 12) || '000000'}
                width={1.5}
                height={40}
                fontSize={10}
                margin={0}
                displayValue={true}
              />
            </div>
          )}

          {/* Mensaje inferior */}
          {config.mensajeInferior ? (
            <p style={{ margin: '10px 0', fontSize: '11px', whiteSpace: 'pre-line' }}>
              {config.mensajeInferior}
            </p>
          ) : (
            <>
              <p style={{ margin: '5px 0' }}>¡GRACIAS POR SU COMPRA!</p>
              <p style={{ margin: '5px 0' }}>Vuelva pronto</p>
            </>
          )}

          {/* Campos personalizados - footer */}
          {config.camposPersonalizados?.filter(c => c.posicion === 'footer').map((campo, idx) => (
            <p key={idx} style={{ margin: '5px 0', fontSize: '10px' }}>
              <strong>{campo.nombre}:</strong> {campo.valor}
            </p>
          ))}

          {/* Leyenda fiscal */}
          <p style={{ margin: '10px 0 5px 0', fontSize: '9px', color: '#666' }}>
            {config.leyendaFiscal || 'Este ticket no es válido como factura'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook personalizado para imprimir tickets
 * Uso:
 * const { printTicket } = usePrintTicket();
 * printTicket(saleData);
 */
export function usePrintTicket() {
  const printTicket = (sale) => {
    // Obtener configuración del ticket
    const config = sale.tienda?.ticketConfig || {};
    const camposMostrar = config.camposMostrar || {
      folio: true,
      fecha: true,
      hora: true,
      cajero: true,
      cliente: true,
      metodoPago: true,
      subtotal: true,
      descuento: true,
      iva: false,
      propina: false,
      cambio: true
    };

    // Obtener ancho y tamaño de fuente
    const anchoTicket = config.anchoTicket || '80mm';
    const tamanoFuente = config.tamanoFuente === 'small' ? '10px' : config.tamanoFuente === 'large' ? '12px' : '11px';

    // Crear ventana temporal para imprimir
    const printWindow = window.open('', '', 'width=800,height=600');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - ${sale.folio || sale._id}</title>
          <style>
            @media print {
              @page {
                size: ${anchoTicket} auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: 'Courier New', monospace;
              width: ${anchoTicket};
              margin: 0 auto;
              padding: 5mm;
            }
            .ticket {
              width: 100%;
              font-size: ${tamanoFuente};
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 2px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; }
            td { padding: 5px 0; border-bottom: 1px dotted #ccc; }
            .total-row { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 10px; }
            .logo { max-width: 60mm; height: auto; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            ${generateTicketHTML(sale, config, camposMostrar)}
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

  const generateTicketHTML = (sale, config, camposMostrar) => {
    const formatMoney = (amount) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('es-MX');
    };

    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Construir encabezado
    let headerHTML = '<div class="center">';

    // Logo
    if (config.mostrarLogo && config.logo) {
      headerHTML += `<img src="${config.logo}" alt="Logo" class="logo" />`;
    }

    // Nombre del negocio
    headerHTML += `<h2>${config.nombreNegocio || sale.tienda?.nombre || 'RESTAURANTE'}</h2>`;
    headerHTML += `<p>${sale.tienda?.direccion || 'Dirección del negocio'}</p>`;
    headerHTML += `<p>Tel: ${sale.tienda?.telefono || '(XXX) XXX-XXXX'}</p>`;

    // RFC
    if (config.mostrarRFC && config.rfc) {
      headerHTML += `<p>RFC: ${config.rfc}</p>`;
    }

    // Mensaje superior
    if (config.mensajeSuperior) {
      headerHTML += `<p style="margin-top: 10px; white-space: pre-line;">${config.mensajeSuperior}</p>`;
    }

    // Campos personalizados - header
    if (config.camposPersonalizados) {
      config.camposPersonalizados.filter(c => c.posicion === 'header').forEach(campo => {
        headerHTML += `<p style="font-size: 10px;"><strong>${campo.nombre}:</strong> ${campo.valor}</p>`;
      });
    }

    headerHTML += '</div><div class="line"></div>';

    // Construir información de venta
    let infoHTML = '';
    if (camposMostrar.folio) {
      infoHTML += `<p><strong>Folio:</strong> ${sale.folio || sale._id?.substring(0, 8).toUpperCase()}</p>`;
    }
    if (camposMostrar.fecha) {
      infoHTML += `<p><strong>Fecha:</strong> ${formatDate(sale.fecha || new Date())}</p>`;
    }
    if (camposMostrar.hora) {
      infoHTML += `<p><strong>Hora:</strong> ${formatTime(sale.fecha || new Date())}</p>`;
    }
    if (camposMostrar.cajero) {
      infoHTML += `<p><strong>Cajero:</strong> ${sale.usuario?.username || sale.usuario?.nombre || 'N/A'}</p>`;
    }
    if (camposMostrar.cliente && sale.cliente) {
      infoHTML += `<p><strong>Cliente:</strong> ${sale.cliente.nombre}</p>`;
      // Mostrar dirección solo para ventas a domicilio
      if ((sale.type === 'domicilio' || sale.tipo === 'domicilio') && sale.cliente.direccion) {
        infoHTML += `<p style="font-size: 11px;"><strong>Dirección:</strong> ${sale.cliente.direccion}</p>`;
      }
    }

    infoHTML += '<div class="line"></div>';

    return `
      ${headerHTML}
      ${infoHTML}
      <table>
        <thead>
          <tr>
            <th>CANT</th>
            <th>DESCRIPCIÓN</th>
            <th style="text-align: right;">PRECIO</th>
            <th style="text-align: right;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items?.map(item => `
            <tr>
              <td>${item.cantidad}</td>
              <td>
                ${item.producto?.nombre || item.nombre}
                ${item.notas ? `<div style="font-size: 10px; color: #666; font-style: italic; margin-top: 2px;">${item.notas}</div>` : ''}
              </td>
              <td style="text-align: right;">${formatMoney(item.precio)}</td>
              <td style="text-align: right;"><strong>${formatMoney(item.cantidad * item.precio)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="line"></div>
      ${camposMostrar.subtotal ? `
        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>Subtotal:</span>
          <span>${formatMoney(sale.subtotal || sale.total)}</span>
        </div>
      ` : ''}
      ${camposMostrar.descuento && sale.descuento > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #d9534f;">
          <span>Descuento:</span>
          <span>-${formatMoney(sale.descuento)}</span>
        </div>
      ` : ''}
      ${camposMostrar.iva && sale.iva > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>IVA:</span>
          <span>${formatMoney(sale.iva)}</span>
        </div>
      ` : ''}
      ${camposMostrar.propina && sale.propina > 0 ? `
        <div style="display: flex; justify-content: space-between; margin: 5px 0;">
          <span>Propina:</span>
          <span>${formatMoney(sale.propina)}</span>
        </div>
      ` : ''}
      <div class="total-row">
        <div style="display: flex; justify-content: space-between;">
          <span>TOTAL:</span>
          <span>${formatMoney(sale.total)}</span>
        </div>
      </div>
      ${camposMostrar.metodoPago ? `<p><strong>Método de pago:</strong> ${sale.metodoPago || 'Efectivo'}</p>` : ''}
      ${camposMostrar.cambio && sale.pagoCon && sale.metodoPago === 'Efectivo' ? `
        <p><strong>Pago con:</strong> ${formatMoney(sale.pagoCon)}</p>
        <p><strong>Cambio:</strong> ${formatMoney(sale.pagoCon - sale.total)}</p>
      ` : ''}
      <div class="line"></div>
      <div class="center">
        <div style="margin: 15px 0;">
          <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="60" fill="white"/>
            <text x="100" y="55" text-anchor="middle" font-family="monospace" font-size="10">${sale.folio || sale._id?.substring(0, 12) || '000000'}</text>
            ${Array.from({length: 40}, (_, i) => `<rect x="${5 + i * 4.5}" y="10" width="${Math.random() > 0.5 ? 2 : 1}" height="35" fill="black"/>`).join('')}
          </svg>
        </div>
        ${config.mensajeInferior ? `
          <p style="white-space: pre-line;">${config.mensajeInferior}</p>
        ` : `
          <p>¡GRACIAS POR SU COMPRA!</p>
          <p>Vuelva pronto</p>
        `}
        ${config.camposPersonalizados ? config.camposPersonalizados.filter(c => c.posicion === 'footer').map(campo => `
          <p style="font-size: 10px; margin: 5px 0;"><strong>${campo.nombre}:</strong> ${campo.valor}</p>
        `).join('') : ''}
        <p style="font-size: 9px; color: #666; margin-top: 10px;">
          ${config.leyendaFiscal || 'Este ticket no es válido como factura'}
        </p>
      </div>
    `;
  };

  return { printTicket };
}
