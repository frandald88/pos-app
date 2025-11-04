import React, { useState, useEffect } from 'react';

export default function TicketConfigModal({ tienda, onClose, onSave }) {
  const [config, setConfig] = useState({
    logo: '',
    mostrarLogo: false,
    nombreNegocio: tienda?.nombre || '',
    rfc: '',
    camposMostrar: {
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
    },
    camposPersonalizados: [],
    mensajeSuperior: '',
    mensajeInferior: '¡GRACIAS POR SU COMPRA!\nVuelva pronto',
    anchoTicket: '80mm',
    tamanoFuente: 'normal',
    mostrarRFC: false,
    leyendaFiscal: 'Este ticket no es válido como factura'
  });

  const [nuevoCampoPersonalizado, setNuevoCampoPersonalizado] = useState({
    nombre: '',
    valor: '',
    posicion: 'footer'
  });

  // Cargar configuración existente de la tienda
  useEffect(() => {
    if (tienda?.ticketConfig) {
      setConfig({
        ...config,
        ...tienda.ticketConfig,
        nombreNegocio: tienda.ticketConfig.nombreNegocio || tienda.nombre
      });
    }
  }, [tienda]);

  const handleCampoMostrarChange = (campo) => {
    setConfig({
      ...config,
      camposMostrar: {
        ...config.camposMostrar,
        [campo]: !config.camposMostrar[campo]
      }
    });
  };

  const handleAgregarCampoPersonalizado = () => {
    if (!nuevoCampoPersonalizado.nombre || !nuevoCampoPersonalizado.valor) {
      return;
    }

    setConfig({
      ...config,
      camposPersonalizados: [
        ...config.camposPersonalizados,
        { ...nuevoCampoPersonalizado }
      ]
    });

    setNuevoCampoPersonalizado({
      nombre: '',
      valor: '',
      posicion: 'footer'
    });
  };

  const handleEliminarCampoPersonalizado = (index) => {
    setConfig({
      ...config,
      camposPersonalizados: config.camposPersonalizados.filter((_, i) => i !== index)
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({
          ...config,
          logo: reader.result,
          mostrarLogo: true
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGuardar = () => {
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                🎨 Configurar Ticket - {tienda?.nombre}
              </h2>
              <p className="text-sm" style={{ color: '#697487' }}>
                Personaliza el diseño del ticket para esta tienda
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Izquierdo - Configuración */}
          <div className="space-y-6">
            {/* Logo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                📸 Logo de la Tienda
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.mostrarLogo}
                    onChange={(e) => setConfig({ ...config, mostrarLogo: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Mostrar logo en el ticket</span>
                </label>

                {config.mostrarLogo && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-sm"
                    />
                    {config.logo && (
                      <div className="mt-2">
                        <img src={config.logo} alt="Logo" className="h-20 object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Información del Negocio */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                🏪 Información del Negocio
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
                  <input
                    type="text"
                    value={config.nombreNegocio}
                    onChange={(e) => setConfig({ ...config, nombreNegocio: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Mi Tienda"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={config.mostrarRFC}
                      onChange={(e) => setConfig({ ...config, mostrarRFC: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Mostrar RFC</span>
                  </label>

                  {config.mostrarRFC && (
                    <input
                      type="text"
                      value={config.rfc}
                      onChange={(e) => setConfig({ ...config, rfc: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="XAXX010101000"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Campos a Mostrar */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                ☑️ Campos a Mostrar
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(config.camposMostrar).map((campo) => (
                  <label key={campo} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.camposMostrar[campo]}
                      onChange={() => handleCampoMostrarChange(campo)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">
                      {campo === 'folio' ? 'Folio' :
                       campo === 'fecha' ? 'Fecha' :
                       campo === 'hora' ? 'Hora' :
                       campo === 'cajero' ? 'Cajero' :
                       campo === 'cliente' ? 'Cliente' :
                       campo === 'metodoPago' ? 'Método de Pago' :
                       campo === 'subtotal' ? 'Subtotal' :
                       campo === 'descuento' ? 'Descuento' :
                       campo === 'iva' ? 'IVA' :
                       campo === 'propina' ? 'Propina' :
                       campo === 'cambio' ? 'Cambio' : campo}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Campos Personalizados */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                ➕ Campos Personalizados
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={nuevoCampoPersonalizado.nombre}
                    onChange={(e) => setNuevoCampoPersonalizado({ ...nuevoCampoPersonalizado, nombre: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                    placeholder="Nombre del campo"
                  />
                  <input
                    type="text"
                    value={nuevoCampoPersonalizado.valor}
                    onChange={(e) => setNuevoCampoPersonalizado({ ...nuevoCampoPersonalizado, valor: e.target.value })}
                    className="px-3 py-2 border rounded-lg text-sm"
                    placeholder="Valor"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={nuevoCampoPersonalizado.posicion}
                    onChange={(e) => setNuevoCampoPersonalizado({ ...nuevoCampoPersonalizado, posicion: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="header">Encabezado</option>
                    <option value="footer">Pie de página</option>
                  </select>

                  <button
                    onClick={handleAgregarCampoPersonalizado}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                  >
                    Agregar
                  </button>
                </div>

                {config.camposPersonalizados.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {config.camposPersonalizados.map((campo, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="text-sm">
                          <span className="font-medium">{campo.nombre}:</span> {campo.valor}
                          <span className="text-xs text-gray-500 ml-2">({campo.posicion})</span>
                        </div>
                        <button
                          onClick={() => handleEliminarCampoPersonalizado(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                💬 Mensajes Personalizados
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Mensaje Superior</label>
                  <textarea
                    value={config.mensajeSuperior}
                    onChange={(e) => setConfig({ ...config, mensajeSuperior: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows="2"
                    placeholder="Mensaje opcional en la parte superior"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mensaje Inferior</label>
                  <textarea
                    value={config.mensajeInferior}
                    onChange={(e) => setConfig({ ...config, mensajeInferior: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows="2"
                    placeholder="¡GRACIAS POR SU COMPRA!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Leyenda Fiscal</label>
                  <input
                    type="text"
                    value={config.leyendaFiscal}
                    onChange={(e) => setConfig({ ...config, leyendaFiscal: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Este ticket no es válido como factura"
                  />
                </div>
              </div>
            </div>

            {/* Configuración Visual */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                🎨 Configuración Visual
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Ancho del Ticket</label>
                  <select
                    value={config.anchoTicket}
                    onChange={(e) => setConfig({ ...config, anchoTicket: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="58mm">58mm (pequeño)</option>
                    <option value="80mm">80mm (estándar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tamaño de Fuente</label>
                  <select
                    value={config.tamanoFuente}
                    onChange={(e) => setConfig({ ...config, tamanoFuente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="small">Pequeño</option>
                    <option value="normal">Normal</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho - Vista Previa */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 text-center" style={{ color: '#23334e' }}>
                👁️ Vista Previa del Ticket
              </h3>

              {/* Vista previa del ticket */}
              <div
                className="bg-white mx-auto p-4 shadow-lg"
                style={{
                  width: config.anchoTicket === '58mm' ? '220px' : '300px',
                  fontFamily: 'Courier New, monospace',
                  fontSize: config.tamanoFuente === 'small' ? '10px' : config.tamanoFuente === 'large' ? '14px' : '12px'
                }}
              >
                {/* Logo */}
                {config.mostrarLogo && config.logo && (
                  <div className="text-center mb-2">
                    <img src={config.logo} alt="Logo" className="h-12 mx-auto" />
                  </div>
                )}

                {/* Nombre del negocio */}
                <div className="text-center font-bold border-b-2 border-dashed border-black pb-2 mb-2">
                  {config.nombreNegocio || 'NOMBRE DEL NEGOCIO'}
                  {config.mostrarRFC && config.rfc && (
                    <div className="text-xs font-normal">RFC: {config.rfc}</div>
                  )}
                  <div className="text-xs font-normal">{tienda?.direccion || 'Dirección'}</div>
                  <div className="text-xs font-normal">{tienda?.telefono || 'Teléfono'}</div>
                </div>

                {/* Mensaje superior */}
                {config.mensajeSuperior && (
                  <div className="text-center text-xs mb-2 pb-2 border-b border-dashed border-black">
                    {config.mensajeSuperior}
                  </div>
                )}

                {/* Campos personalizados (header) */}
                {config.camposPersonalizados.filter(c => c.posicion === 'header').map((campo, index) => (
                  <div key={index} className="text-xs">
                    <strong>{campo.nombre}:</strong> {campo.valor}
                  </div>
                ))}

                {/* Información de la venta */}
                <div className="text-xs space-y-1 mb-2">
                  {config.camposMostrar.folio && <div><strong>Folio:</strong> VTA-00123</div>}
                  {config.camposMostrar.fecha && <div><strong>Fecha:</strong> {new Date().toLocaleDateString()}</div>}
                  {config.camposMostrar.hora && <div><strong>Hora:</strong> {new Date().toLocaleTimeString()}</div>}
                  {config.camposMostrar.cajero && <div><strong>Cajero:</strong> Juan Pérez</div>}
                  {config.camposMostrar.cliente && <div><strong>Cliente:</strong> María González</div>}
                </div>

                {/* Productos */}
                <div className="border-y border-dashed border-black py-2 mb-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-black">
                        <th className="text-left">CANT</th>
                        <th className="text-left">PROD</th>
                        <th className="text-right">$</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2</td>
                        <td>Producto 1</td>
                        <td className="text-right">$50.00</td>
                      </tr>
                      <tr>
                        <td>1</td>
                        <td>Producto 2</td>
                        <td className="text-right">$30.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="text-xs space-y-1">
                  {config.camposMostrar.subtotal && (
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>$80.00</span>
                    </div>
                  )}
                  {config.camposMostrar.descuento && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento:</span>
                      <span>-$0.00</span>
                    </div>
                  )}
                  {config.camposMostrar.iva && (
                    <div className="flex justify-between">
                      <span>IVA (16%):</span>
                      <span>$12.80</span>
                    </div>
                  )}
                  {config.camposMostrar.propina && (
                    <div className="flex justify-between">
                      <span>Propina:</span>
                      <span>$0.00</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-black pt-1 mt-1">
                    <span>TOTAL:</span>
                    <span>$80.00</span>
                  </div>
                </div>

                {/* Método de pago */}
                {config.camposMostrar.metodoPago && (
                  <div className="text-xs mt-2">
                    <strong>Método de pago:</strong> Efectivo
                  </div>
                )}
                {config.camposMostrar.cambio && (
                  <div className="text-xs">
                    <strong>Cambio:</strong> $20.00
                  </div>
                )}

                {/* Campos personalizados (footer) */}
                {config.camposPersonalizados.filter(c => c.posicion === 'footer').length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-black">
                    {config.camposPersonalizados.filter(c => c.posicion === 'footer').map((campo, index) => (
                      <div key={index} className="text-xs">
                        <strong>{campo.nombre}:</strong> {campo.valor}
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensaje inferior */}
                <div className="text-center text-xs mt-2 pt-2 border-t-2 border-dashed border-black">
                  {config.mensajeInferior.split('\n').map((linea, i) => (
                    <div key={i}>{linea}</div>
                  ))}
                </div>

                {/* Leyenda fiscal */}
                <div className="text-center text-xs mt-2" style={{ fontSize: '9px', color: '#666' }}>
                  {config.leyendaFiscal}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Botones */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            style={{ color: '#46546b' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-6 py-2 rounded-lg text-white transition-colors hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
          >
            💾 Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
