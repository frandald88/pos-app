import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export default function PrintCorteModal({ isOpen, onClose, resultados, tiendas, formatCurrency, formatDateTime, getTiendaNombre, esPreCorte = false }) {
  const ticketRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
    documentTitle: 'Corte-de-Caja',
    onAfterPrint: () => {
      console.log('[SUCCESS] Corte impreso');
    },
  });

  if (!isOpen || !resultados) return null;

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

  const balanceEfectivo = (resultados.corte?.porMetodo?.efectivo || 0);
  const balanceTransferencia = (resultados.corte?.porMetodo?.transferencia || 0);
  const balanceTarjeta = (resultados.corte?.porMetodo?.tarjeta || 0);

  // Usar el total de transacciones del resumen que cuenta ventas únicas correctamente
  const totalVentasCantidad = resultados.resumen?.totalTransacciones || 0;

  // ⭐ NUEVOS DATOS DEL BACKEND
  const efectivoInicial = resultados.turno?.efectivoInicial || 0;
  const efectivoFinal = resultados.turno?.efectivoFinal;
  const cajero = resultados.turno?.cajero || 'N/A';
  const estacion = resultados.turno?.estacion || 'N/A';

  const totalDescuentos = resultados.descuentos?.total || 0;
  const ventasConDescuento = resultados.descuentos?.ventasConDescuento || 0;
  const ventasCanceladas = resultados.ventasCanceladas || 0;
  const totalPropinas = resultados.propinas?.total || 0;
  const ventasConPropina = resultados.propinas?.ventasConPropina || 0;

  const folioInicial = resultados.folios?.folioInicial || 'N/A';
  const folioFinal = resultados.folios?.folioFinal || 'N/A';

  const ventasMostrador = resultados.porTipoServicio?.mostrador || { total: 0, cantidad: 0 };
  const ventasDomicilio = resultados.porTipoServicio?.domicilio || { total: 0, cantidad: 0 };
  const ventasRecoger = resultados.porTipoServicio?.recoger || { total: 0, cantidad: 0 };

  // Calcular sobrante/faltante si tenemos efectivo final
  const sobranteFaltante = efectivoFinal !== null && efectivoFinal !== undefined
    ? efectivoFinal - balanceEfectivo
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b flex justify-between items-center" style={{ backgroundColor: esPreCorte ? '#10b981' : '#23334e' }}>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {esPreCorte ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Vista Previa - PRE-CORTE
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Vista Previa - Corte de Caja
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del Ticket */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white mx-auto" style={{ width: '80mm', padding: '5mm' }}>
            <div ref={ticketRef}>
              <style>{`
                @media print {
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  body {
                    width: 80mm;
                  }
                }
                .ticket-content {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.4;
                  color: #000;
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
                .center {
                  text-align: center;
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
              `}</style>

              <div className="ticket-content">
                {/* Encabezado */}
                <div className="center separator-double">
                  <div className="bold">{tienda?.nombre || 'NOMBRE DEL NEGOCIO'}</div>
                  <div>{tienda?.direccion || 'Dirección del negocio'}</div>
                  <div>{tienda?.telefono || 'Teléfono'}</div>
                </div>
                <div className="separator-double"></div>

                {esPreCorte && (
                  <>
                    <div className="center title" style={{ fontSize: '16px', border: '2px solid #000', padding: '8px', margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <svg style={{ width: '20px', height: '20px', display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      PRE-CORTE
                      <svg style={{ width: '20px', height: '20px', display: 'inline-block' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="center" style={{ fontSize: '10px', marginBottom: '8px' }}>
                      (REPORTE PRELIMINAR - TURNO ACTIVO)
                    </div>
                    <div className="separator"></div>
                  </>
                )}

                <div className="center title">{esPreCorte ? 'PRE-CORTE DE CAJA' : 'CORTE DE CAJA'}</div>
                <div className="line-item">
                  <span>DEL</span>
                  <span>{formatDateTime(resultados.periodo?.inicio)}</span>
                </div>
                <div className="line-item">
                  <span>AL</span>
                  <span>{formatDateTime(resultados.periodo?.fin)}</span>
                </div>
                <div className="line-item">
                  <span>TIENDA:</span>
                  <span>{tiendaNombre}</span>
                </div>

                <div className="separator"></div>

                {/* Información del turno */}
                <div className="line-item">
                  <span>TURNO:</span>
                  <span>{estacion}</span>
                </div>
                <div className="line-item">
                  <span>CAJERO:</span>
                  <span>{cajero}</span>
                </div>
                <div className="line-item">
                  <span>FOLIO INICIAL:</span>
                  <span>{folioInicial}</span>
                </div>
                <div className="line-item">
                  <span>FOLIO FINAL:</span>
                  <span>{folioFinal}</span>
                </div>

                {/* Notas de Apertura */}
                {resultados.turno?.notasApertura && (
                  <>
                    <div className="separator"></div>
                    <div className="section-title">NOTAS DE APERTURA</div>
                    <div style={{ fontSize: '10px', padding: '5px', backgroundColor: '#f0f0f0', marginTop: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {resultados.turno.notasApertura}
                    </div>
                  </>
                )}

                {/* Notas de Cierre */}
                {resultados.turno?.notasCierre && (
                  <>
                    <div className="separator"></div>
                    <div className="section-title">NOTAS DE CIERRE</div>
                    <div style={{ fontSize: '10px', padding: '5px', backgroundColor: '#f0f0f0', marginTop: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {resultados.turno.notasCierre}
                    </div>
                    {resultados.turno.cerradoPor && (
                      <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '3px' }}>
                        (Cerrado por: {resultados.turno.cerradoPor})
                      </div>
                    )}
                  </>
                )}

                <div className="separator"></div>

                {/* Resumen de efectivo */}
                <div className="line-item">
                  <span>- EFECTIVO INICIAL:</span>
                  <span>{formatCurrency(efectivoInicial)}</span>
                </div>
                <div className="line-item">
                  <span>+ VENTAS EFECTIVO:</span>
                  <span>{formatCurrency(ventasEfectivo)}</span>
                </div>
                <div className="line-item">
                  <span>- GASTOS EFECTIVO:</span>
                  <span>{formatCurrency(resultados.gastos?.desglose?.efectivo?.total || 0)}</span>
                </div>
                <div className="line-item">
                  <span>= EFECTIVO ESPERADO:</span>
                  <span>{formatCurrency(balanceEfectivo)}</span>
                </div>
                {efectivoFinal !== null && efectivoFinal !== undefined && (
                  <div className="line-item">
                    <span>- EFECTIVO CONTADO:</span>
                    <span>{formatCurrency(efectivoFinal)}</span>
                  </div>
                )}
                <div className="line-item">
                  <span>- TARJETA:</span>
                  <span>{formatCurrency(balanceTarjeta)}</span>
                </div>
                <div className="line-item">
                  <span>- TRANSFERENCIA:</span>
                  <span>{formatCurrency(balanceTransferencia)}</span>
                </div>

                <div className="separator"></div>

                <div className="line-item bold">
                  <span>= SALDO FINAL:</span>
                  <span>{formatCurrency(resultados.corte?.final || 0)}</span>
                </div>
                <div className="line-item indent">
                  <span>EFECTIVO FINAL:</span>
                  <span>{formatCurrency(balanceEfectivo)}</span>
                </div>

                <div className="separator"></div>

                {/* Forma de pago ventas */}
                <div className="section-title">FORMA DE PAGO VENTAS</div>
                <div className="separator"></div>

                <div className="line-item">
                  <span>EFECTIVO</span>
                  <span>{formatCurrency(ventasEfectivo)}</span>
                </div>
                <div className="line-item">
                  <span>TRANSFERENCIA</span>
                  <span>{formatCurrency(ventasTransferencia)}</span>
                </div>
                <div className="line-item">
                  <span>TARJETA</span>
                  <span>{formatCurrency(ventasTarjeta)}</span>
                </div>

                <div className="separator"></div>

                {/* Desglose fiscal */}
                <div className="section-title">===== DESGLOSE FISCAL =====</div>

                <div className="separator"></div>
                <div className="line-item">
                  <span>SUBTOTAL (SIN IVA)</span>
                  <span>{formatCurrency(resultados.impuestos?.subtotal || 0)}</span>
                </div>
                <div className="line-item">
                  <span>IVA ({resultados.impuestos?.tasaPorcentaje || '10%'})</span>
                  <span>{formatCurrency(resultados.impuestos?.iva || 0)}</span>
                </div>
                <div className="line-item bold">
                  <span>TOTAL CON IVA</span>
                  <span>{formatCurrency(resultados.impuestos?.total || totalVentas)}</span>
                </div>

                <div className="separator"></div>

                <div className="line-item">
                  <span>DESCUENTOS APLICADOS</span>
                  <span>{formatCurrency(totalDescuentos)}</span>
                </div>
                <div className="line-item bold">
                  <span>VENTA NETA FINAL</span>
                  <span>{formatCurrency(totalVentas)}</span>
                </div>

                <div className="separator"></div>

                {/* Estadísticas */}
                <div className="line-item">
                  <span>VENTAS NORMALES</span>
                  <span>: {totalVentasCantidad}</span>
                </div>
                <div className="line-item">
                  <span>VENTAS CANCELADAS</span>
                  <span>: {ventasCanceladas}</span>
                </div>
                <div className="line-item">
                  <span>VENTAS CON DESCUENTO</span>
                  <span>: {ventasConDescuento}</span>
                </div>
                <div className="line-item">
                  <span>CONSUMO PROMEDIO</span>
                  <span>: {formatCurrency(resultados.resumen?.promedioVenta || 0)}</span>
                </div>
                <div className="line-item">
                  <span>NUMERO DE VENTAS</span>
                  <span>: {resultados.resumen?.totalTransacciones || 0}</span>
                </div>
                <div className="line-item">
                  <span>PROPINAS ({ventasConPropina})</span>
                  <span>: {formatCurrency(totalPropinas)}</span>
                </div>
                <div className="line-item">
                  <span>DESCUENTO MONETARIO</span>
                  <span>: {formatCurrency(totalDescuentos)}</span>
                </div>

                <div className="separator"></div>

                <div className="line-item bold">
                  <span>TOTAL DESCUENTOS</span>
                  <span>: {formatCurrency(totalDescuentos)}</span>
                </div>

                <div className="separator"></div>

                {/* Ventas por tipo de servicio */}
                <div className="section-title">POR TIPO DE SERVICIO</div>
                <div className="separator"></div>

                <div className="line-item">
                  <span>MOSTRADOR ({ventasMostrador.cantidad})</span>
                  <span>{formatCurrency(ventasMostrador.total)}</span>
                </div>
                <div className="line-item">
                  <span>DOMICILIO ({ventasDomicilio.cantidad})</span>
                  <span>{formatCurrency(ventasDomicilio.total)}</span>
                </div>
                <div className="line-item">
                  <span>RECOGER ({ventasRecoger.cantidad})</span>
                  <span>{formatCurrency(ventasRecoger.total)}</span>
                </div>

                <div className="separator"></div>

                {/* Totales por método */}
                <div className="line-item">
                  <span>EFECTIVO:</span>
                  <span>{formatCurrency(ventasEfectivo)}</span>
                </div>
                <div className="line-item">
                  <span>TARJETA:</span>
                  <span>{formatCurrency(ventasTarjeta)}</span>
                </div>
                <div className="line-item">
                  <span>TRANSFERENCIA:</span>
                  <span>{formatCurrency(ventasTransferencia)}</span>
                </div>

                <div className="separator"></div>

                <div className="line-item bold">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(totalVentas)}</span>
                </div>
                <div className="line-item bold">
                  <span>SOBRANTE(+) O FALTANTE(-):</span>
                  <span>{sobranteFaltante !== null ? formatCurrency(sobranteFaltante) : 'N/A'}</span>
                </div>

                <div className="separator-double"></div>

                {/* Ventas por categoría - si hay datos */}
                {resultados.porCategoria && resultados.porCategoria.length > 0 && (
                  <>
                    <div className="section-title">VENTAS POR CATEGORIA</div>
                    <div className="separator"></div>
                    {resultados.porCategoria.map((cat, idx) => (
                      <div key={idx} className="line-item">
                        <span>{cat.categoria.toUpperCase()} ({cat.cantidad})</span>
                        <span>{formatCurrency(cat.total)}</span>
                      </div>
                    ))}
                    <div className="separator"></div>
                  </>
                )}

                {/* Descuentos por categoría - si hay datos */}
                {resultados.descuentosPorCategoria && resultados.descuentosPorCategoria.length > 0 && (
                  <>
                    <div className="section-title">DESCUENTOS POR CATEGORIA</div>
                    <div className="separator"></div>
                    {resultados.descuentosPorCategoria.map((cat, idx) => (
                      <div key={idx} className="line-item">
                        <span>{cat.categoria.toUpperCase()}</span>
                        <span>{formatCurrency(cat.totalDescuentos)}</span>
                      </div>
                    ))}
                    <div className="separator-double"></div>
                  </>
                )}

                <div className="separator-double"></div>

                <div className="center">
                  <div>Reporte generado</div>
                  <div>{new Date().toLocaleString('es-MX')}</div>
                </div>

                <div className="separator-double"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg font-medium border transition-all duration-200 hover:shadow-md"
            style={{ borderColor: '#e5e7eb', color: '#697487' }}
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md flex items-center gap-2"
            style={{ backgroundColor: '#23334e' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
