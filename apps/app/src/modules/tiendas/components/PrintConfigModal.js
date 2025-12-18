import React, { useState, useEffect } from 'react';

export default function PrintConfigModal({ tienda, onClose, onSave }) {
  const [config, setConfig] = useState({
    directPrint: false,
    printServerUrl: 'http://localhost:9100',
    printerName: '',
    printerType: 'EPSON',
    connectionType: 'USB',
    printerIP: '',
    printerPort: 9100,
    autoOpenCashDrawer: false,
    defaultCopies: 1,
    comandaConfig: {
      enabled: false,
      printerName: '',
      autoPrint: false
    }
  });

  // Cargar configuración existente de la tienda
  useEffect(() => {
    if (tienda?.printConfig) {
      setConfig({
        ...config,
        ...tienda.printConfig,
        comandaConfig: {
          ...config.comandaConfig,
          ...tienda.printConfig.comandaConfig
        }
      });
    }
  }, [tienda]);

  const handleChange = (field, value) => {
    setConfig({
      ...config,
      [field]: value
    });
  };

  const handleComandaConfigChange = (field, value) => {
    setConfig({
      ...config,
      comandaConfig: {
        ...config.comandaConfig,
        [field]: value
      }
    });
  };

  const handleGuardar = () => {
    onSave(config);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold" style={{ color: '#23334e' }}>
              Configuración de Impresión - {tienda?.nombre}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sección: Impresión Directa */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Acerca de la Impresión Directa</h3>
                <p className="text-sm text-blue-800 mb-2">
                  La impresión directa envía tickets automáticamente a la impresora térmica sin mostrar el diálogo del navegador.
                  Requiere instalar el <strong>Print Server</strong> en la computadora donde está la impresora.
                </p>
                <p className="text-sm text-blue-800">
                  Si la impresión directa está desactivada o falla, se usará el diálogo estándar del navegador.
                </p>
              </div>
            </div>
          </div>

          {/* Toggle de Impresión Directa */}
          <div className="bg-white border rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-semibold text-lg" style={{ color: '#23334e' }}>
                  Activar Impresión Directa
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Enviar tickets directamente a la impresora térmica sin diálogo
                </p>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={config.directPrint}
                  onChange={(e) => handleChange('directPrint', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>

          {/* Configuraciones - Solo se muestran si directPrint está activado */}
          {config.directPrint && (
            <>
              {/* Servidor de Impresión */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  Servidor de Impresión
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    URL del Print Server
                  </label>
                  <input
                    type="text"
                    value={config.printServerUrl}
                    onChange={(e) => handleChange('printServerUrl', e.target.value)}
                    placeholder="http://localhost:9100"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    URL donde está ejecutándose el Print Server (generalmente localhost)
                  </p>
                </div>
              </div>

              {/* Configuración de la Impresora */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  Configuración de la Impresora
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Nombre de la Impresora
                    </label>
                    <input
                      type="text"
                      value={config.printerName}
                      onChange={(e) => handleChange('printerName', e.target.value)}
                      placeholder="Ej: EPSON TM-T20"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Nombre exacto como aparece en el sistema
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Tipo de Impresora
                    </label>
                    <select
                      value={config.printerType}
                      onChange={(e) => handleChange('printerType', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EPSON">EPSON</option>
                      <option value="STAR">STAR</option>
                      <option value="TANCA">TANCA</option>
                      <option value="DARUMA">DARUMA</option>
                      <option value="BEMATECH">BEMATECH</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Tipo de Conexión
                    </label>
                    <select
                      value={config.connectionType}
                      onChange={(e) => handleChange('connectionType', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USB">USB</option>
                      <option value="NETWORK">Red (TCP/IP)</option>
                      <option value="SERIAL">Serial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Copias por Defecto
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={config.defaultCopies}
                      onChange={(e) => handleChange('defaultCopies', parseInt(e.target.value))}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Mostrar campos de red solo si connectionType es NETWORK */}
                {config.connectionType === 'NETWORK' && (
                  <div className="grid md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        IP de la Impresora
                      </label>
                      <input
                        type="text"
                        value={config.printerIP}
                        onChange={(e) => handleChange('printerIP', e.target.value)}
                        placeholder="192.168.1.100"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Puerto
                      </label>
                      <input
                        type="number"
                        value={config.printerPort}
                        onChange={(e) => handleChange('printerPort', parseInt(e.target.value))}
                        placeholder="9100"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opciones Adicionales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  Opciones Adicionales
                </h3>

                <div className="bg-white border rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-medium" style={{ color: '#23334e' }}>
                        Abrir Cajón Automáticamente
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Abrir el cajón de dinero después de cada venta
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.autoOpenCashDrawer}
                      onChange={(e) => handleChange('autoOpenCashDrawer', e.target.checked)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Configuración de Comanda (Cocina) */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">
                    Impresora de Comanda (Cocina)
                  </h3>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <label className="flex items-center justify-between cursor-pointer mb-4">
                    <div>
                      <div className="font-medium" style={{ color: '#23334e' }}>
                        Habilitar Impresión de Comandas
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Enviar comandas a una impresora separada en la cocina
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.comandaConfig.enabled}
                      onChange={(e) => handleComandaConfigChange('enabled', e.target.checked)}
                      className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                    />
                  </label>

                  {config.comandaConfig.enabled && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Nombre de la Impresora de Cocina
                        </label>
                        <input
                          type="text"
                          value={config.comandaConfig.printerName}
                          onChange={(e) => handleComandaConfigChange('printerName', e.target.value)}
                          placeholder="Ej: EPSON Kitchen"
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div className="bg-white border rounded-lg p-3">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.comandaConfig.autoPrint}
                            onChange={(e) => handleComandaConfigChange('autoPrint', e.target.checked)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500 rounded mr-3"
                          />
                          <div>
                            <div className="font-medium text-sm" style={{ color: '#23334e' }}>
                              Imprimir Automáticamente
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">
                              Imprimir comanda automáticamente al registrar venta
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-gray-100"
            style={{ color: '#46546b', backgroundColor: '#f4f6fa' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: '#23334e' }}
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
