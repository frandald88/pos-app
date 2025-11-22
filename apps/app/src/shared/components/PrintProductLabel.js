import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';

/**
 * Componente para imprimir etiquetas de productos con código de barras
 * Formato optimizado para etiquetas de 2.5" x 1.5" (64mm x 38mm)
 */
export default function PrintProductLabel({ product, onClose }) {
  const labelRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
    documentTitle: `Etiqueta-${product.barcode || product.sku}`,
    onAfterPrint: () => {
      console.log('✅ Etiqueta impresa');
      if (onClose) onClose();
    },
  });

  // Formatear dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
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
          🖨️ Imprimir Etiqueta
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

      {/* Vista previa de la etiqueta */}
      <div
        ref={labelRef}
        style={{
          width: '64mm',
          height: '38mm',
          margin: '0 auto',
          padding: '3mm',
          backgroundColor: 'white',
          border: '1px solid #000',
          fontFamily: 'Arial, sans-serif',
          fontSize: '8px',
          color: 'black',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Nombre del producto */}
        <div style={{
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '2mm',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {product.name}
        </div>

        {/* Código de barras */}
        {product.barcode && (
          <div style={{
            textAlign: 'center',
            margin: '1mm 0',
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Barcode
              value={product.barcode}
              width={1.2}
              height={20}
              fontSize={8}
              margin={0}
              displayValue={true}
            />
          </div>
        )}

        {/* Información inferior */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2mm',
          paddingTop: '2mm',
          borderTop: '1px solid #000'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
            SKU: {product.sku}
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#000'
          }}>
            {formatMoney(product.price)}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          @page {
            size: 64mm 38mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Hook personalizado para imprimir etiquetas de productos
 * Uso:
 * const { printLabel } = usePrintProductLabel();
 * printLabel(productData);
 */
export function usePrintProductLabel() {
  const printLabel = (product) => {
    // Crear ventana temporal para imprimir
    const printWindow = window.open('', '', 'width=400,height=300');

    const formatMoney = (amount) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(amount);
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiqueta - ${product.barcode || product.sku}</title>
          <style>
            @media print {
              @page {
                size: 64mm 38mm;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              width: 64mm;
              height: 38mm;
              margin: 0;
              padding: 3mm;
              box-sizing: border-box;
            }
            .label {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              border: 1px solid #000;
              padding: 3mm;
            }
            .product-name {
              font-size: 11px;
              font-weight: bold;
              text-align: center;
              margin-bottom: 2mm;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-container {
              text-align: center;
              margin: 1mm 0;
              flex-grow: 1;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 2mm;
              padding-top: 2mm;
              border-top: 1px solid #000;
              font-size: 8px;
            }
            .sku {
              font-size: 10px;
              font-weight: bold;
            }
            .price {
              font-size: 14px;
              font-weight: bold;
            }
            .barcode-svg {
              width: 100%;
              max-width: 55mm;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="product-name">${product.name}</div>

            ${product.barcode ? `
              <div class="barcode-container">
                <svg class="barcode-svg" height="25" xmlns="http://www.w3.org/2000/svg">
                  <rect width="100%" height="25" fill="white"/>
                  <text x="50%" y="23" text-anchor="middle" font-family="monospace" font-size="8">${product.barcode}</text>
                  ${Array.from({length: 50}, (_, i) =>
                    `<rect x="${i * 2}%" y="2" width="${Math.random() > 0.5 ? '1.5%' : '0.8%'}" height="15" fill="black"/>`
                  ).join('')}
                </svg>
              </div>
            ` : ''}

            <div class="footer">
              <div class="sku">SKU: ${product.sku}</div>
              <div class="price">${formatMoney(product.price)}</div>
            </div>
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

  return { printLabel };
}
