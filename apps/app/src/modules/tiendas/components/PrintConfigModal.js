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

  // Estados para auto-detección
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

      // Si ya tiene configuración, mostrar campos avanzados
      if (tienda.printConfig.directPrint) {
        setShowAdvanced(true);
      }
    }
  }, [tienda]);

  // Verificar estado del print server al cargar
  useEffect(() => {
    checkPrintServer();
  }, []);

  // Verificar si el print server está disponible
  const checkPrintServer = async () => {
    setServerStatus('checking');
    try {
      const response = await fetch(`${config.printServerUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        setServerStatus('online');
        showMessage('success', 'Print Server detectado correctamente');
      } else {
        setServerStatus('offline');
      }
    } catch (error) {
      setServerStatus('offline');
    }
  };

  // Detectar impresoras disponibles
  const detectPrinters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.printServerUrl}/printers/list`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        setAvailablePrinters(data.printers || []);

        if (data.printers && data.printers.length > 0) {
          showMessage('success', `Se encontraron ${data.printers.length} impresoras`);

          // Auto-seleccionar la primera impresora térmica
          const thermalPrinter = data.printers.find(p => p.isThermal);
          if (thermalPrinter) {
            selectPrinter(thermalPrinter);
          }
        } else {
          showMessage('warning', 'No se encontraron impresoras en el sistema');
        }
      } else {
        showMessage('error', 'Error al detectar impresoras');
      }
    } catch (error) {
      console.error('Error detectando impresoras:', error);
      showMessage('error', 'No se pudo conectar con el Print Server');
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar impresora de la lista
  const selectPrinter = (printer) => {
    setSelectedPrinter(printer);
    setConfig({
      ...config,
      printerName: printer.name,
      printerType: printer.type,
      connectionType: printer.connection,
      directPrint: true
    });
    showMessage('success', `Impresora "${printer.displayName}" seleccionada`);
  };

  // Configuración rápida automática
  const quickSetup = async () => {
    setLoading(true);
    try {
      // 1. Verificar print server
      await checkPrintServer();

      if (serverStatus === 'offline') {
        showMessage('error', 'Print Server no disponible. Por favor, inicia el servidor primero.');
        setLoading(false);
        return;
      }

      // 2. Detectar impresoras
      const response = await fetch(`${config.printServerUrl}/printers/list`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error('No se pudieron detectar impresoras');
      }

      const data = await response.json();
      setAvailablePrinters(data.printers || []);

      // 3. Buscar impresora térmica
      const thermalPrinter = data.printers.find(p => p.isThermal);

      if (!thermalPrinter) {
        showMessage('warning', 'No se encontró impresora térmica. Selecciona una manualmente.');
        setLoading(false);
        return;
      }

      // 4. Configurar automáticamente
      const newConfig = {
        ...config,
        directPrint: true,
        printerName: thermalPrinter.name,
        printerType: thermalPrinter.type,
        connectionType: thermalPrinter.connection
      };

      setConfig(newConfig);
      setSelectedPrinter(thermalPrinter);

      // 5. Hacer prueba de impresión
      const testResponse = await fetch(`${config.printServerUrl}/test-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
        signal: AbortSignal.timeout(10000)
      });

      if (testResponse.ok) {
        showMessage('success', '¡Configuración completada! Se imprimió un ticket de prueba.');
      } else {
        showMessage('warning', 'Configuración guardada, pero la prueba de impresión falló.');
      }

    } catch (error) {
      console.error('Error en configuración rápida:', error);
      showMessage('error', 'Error en la configuración automática');
    } finally {
      setLoading(false);
    }
  };

  // Prueba de impresión manual
  const testPrint = async () => {
    if (!config.printerName) {
      showMessage('error', 'Por favor selecciona una impresora primero');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.printServerUrl}/test-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        showMessage('success', 'Ticket de prueba enviado a la impresora');
      } else {
        const error = await response.json();
        showMessage('error', `Error: ${error.details || 'No se pudo imprimir'}`);
      }
    } catch (error) {
      console.error('Error en prueba de impresión:', error);
      showMessage('error', 'No se pudo conectar con la impresora');
    } finally {
      setLoading(false);
    }
  };

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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
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
          {/* Mensajes */}
          {message.text && (
            <div className={`p-4 rounded-lg border-l-4 ${
              message.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' :
              message.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' :
              message.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' :
              'bg-blue-50 border-blue-400 text-blue-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Estado del Print Server */}
          <div className={`p-4 rounded-lg border-l-4 ${
            serverStatus === 'online' ? 'bg-green-50 border-green-400' :
            serverStatus === 'offline' ? 'bg-red-50 border-red-400' :
            'bg-gray-50 border-gray-400'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {serverStatus === 'online' && (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {serverStatus === 'offline' && (
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {serverStatus === 'checking' && (
                  <svg className="w-6 h-6 text-gray-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <div>
                  <div className="font-semibold" style={{ color: '#23334e' }}>
                    Estado del Print Server
                  </div>
                  <p className="text-sm text-gray-600">
                    {serverStatus === 'online' && `✅ Conectado en ${config.printServerUrl}`}
                    {serverStatus === 'offline' && '❌ No se pudo conectar al servidor'}
                    {serverStatus === 'checking' && 'Verificando conexión...'}
                  </p>
                </div>
              </div>
              <button
                onClick={checkPrintServer}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#46546b' }}
              >
                Verificar
              </button>
            </div>

            {serverStatus === 'offline' && (
              <div className="mt-3 p-3 bg-white rounded-lg text-sm">
                <p className="font-medium text-red-800 mb-2">¿No tienes el Print Server instalado?</p>
                <p className="text-gray-700 mb-2">Descarga e inicia el Print Server para habilitar la impresión directa:</p>
                <a
                  href="https://github.com/yourusername/astrodish/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Descargar Print Server →
                </a>
              </div>
            )}
          </div>

          {/* Configuración Rápida */}
          {serverStatus === 'online' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-start gap-4">
                <svg className="w-8 h-8 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">Configuración Rápida</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Detecta automáticamente tu impresora térmica y configura todo en un solo paso.
                  </p>
                  <button
                    onClick={quickSetup}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Configurando...' : '⚡ Configurar Automáticamente'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detección Manual de Impresoras */}
          {serverStatus === 'online' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  Impresoras Disponibles
                </h3>
                <button
                  onClick={detectPrinters}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium border-2 rounded-lg transition-all hover:shadow-md disabled:opacity-50"
                  style={{ color: '#46546b', borderColor: '#cbd5e1' }}
                >
                  {loading ? 'Detectando...' : '🔍 Detectar Impresoras'}
                </button>
              </div>

              {availablePrinters.length > 0 && (
                <div className="grid gap-3">
                  {availablePrinters.map((printer, index) => (
                    <div
                      key={index}
                      onClick={() => selectPrinter(printer)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedPrinter?.name === printer.name
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            printer.isThermal ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            {printer.isThermal ? '🖨️' : '📄'}
                          </div>
                          <div>
                            <div className="font-semibold" style={{ color: '#23334e' }}>
                              {printer.displayName}
                              {printer.isThermal && (
                                <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  Térmica
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {printer.type} • {printer.connection}
                            </p>
                          </div>
                        </div>
                        {selectedPrinter?.name === printer.name && (
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Toggle de Opciones Avanzadas */}
          {selectedPrinter && (
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Opciones Avanzadas
              </button>
            </div>
          )}

          {/* Campos Avanzados */}
          {showAdvanced && (
            <>
              {/* URL del Servidor */}
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
              </div>

              {/* Nombre de Impresora */}
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
              </div>

              {/* Tipo y Conexión */}
              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              {/* Configuración de Red */}
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

              {/* Opciones Adicionales */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.autoOpenCashDrawer}
                    onChange={(e) => handleChange('autoOpenCashDrawer', e.target.checked)}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <label className="text-sm font-medium" style={{ color: '#23334e' }}>
                    Abrir cajón automáticamente después de cada venta
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Copias por defecto:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={config.defaultCopies}
                    onChange={(e) => handleChange('defaultCopies', parseInt(e.target.value))}
                    className="w-20 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Configuración de Comanda */}
              <div className="space-y-4 bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">
                    Impresora de Comanda (Cocina)
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.comandaConfig.enabled}
                    onChange={(e) => handleComandaConfigChange('enabled', e.target.checked)}
                    className="w-5 h-5 text-green-600 focus:ring-green-500 rounded"
                  />
                  <label className="font-medium" style={{ color: '#23334e' }}>
                    Habilitar impresión de comandas
                  </label>
                </div>

                {config.comandaConfig.enabled && (
                  <div className="space-y-3 pt-3 border-t border-green-200">
                    <input
                      type="text"
                      value={config.comandaConfig.printerName}
                      onChange={(e) => handleComandaConfigChange('printerName', e.target.value)}
                      placeholder="Nombre de la impresora de cocina"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.comandaConfig.autoPrint}
                        onChange={(e) => handleComandaConfigChange('autoPrint', e.target.checked)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                      />
                      <label className="text-sm" style={{ color: '#23334e' }}>
                        Imprimir automáticamente al registrar venta
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Botón de Prueba */}
          {selectedPrinter && serverStatus === 'online' && (
            <div className="pt-4 border-t">
              <button
                onClick={testPrint}
                disabled={loading}
                className="w-full px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: '#10b981' }}
              >
                {loading ? 'Imprimiendo...' : '🧪 Imprimir Ticket de Prueba'}
              </button>
            </div>
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
            disabled={loading}
            className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: '#23334e' }}
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}
