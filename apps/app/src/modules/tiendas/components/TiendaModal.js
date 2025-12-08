import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';

const TiendaModal = ({
  isOpen,
  onClose,
  onSubmit,
  tienda,
  onChange,
  isEditing,
  cargando,
  modalError,
  setModalError
}) => {
  // Inicializar estados basados en tienda.telefono
  const parsePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') {
      return { code: '+52', number: '' };
    }

    const match = phone.match(/^(\+\d+)\s*(.*)$/);
    if (match) {
      return { code: match[1], number: match[2].trim() };
    }

    // Si no tiene código de país, asumir que es solo el número
    return { code: '+52', number: phone };
  };

  const initialPhone = parsePhoneNumber(tienda.telefono);
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.number);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const lastTiendaTelefonoRef = useRef(tienda.telefono);

  // Códigos de país comunes
  const countryCodes = [
    { code: '+52', country: 'México', flag: '🇲🇽' },
    { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
    { code: '+1', country: 'Canadá', flag: '🇨🇦' },
    { code: '+54', country: 'Argentina', flag: '🇦🇷' },
    { code: '+56', country: 'Chile', flag: '🇨🇱' },
    { code: '+57', country: 'Colombia', flag: '🇨🇴' },
    { code: '+34', country: 'España', flag: '🇪🇸' },
    { code: '+51', country: 'Perú', flag: '🇵🇪' },
  ];

  // Solo actualizar si tienda.telefono cambió REALMENTE (no por re-renders)
  useEffect(() => {
    if (isOpen && tienda.telefono !== lastTiendaTelefonoRef.current) {
      console.log('📞 Teléfono cambió de', lastTiendaTelefonoRef.current, 'a', tienda.telefono);
      lastTiendaTelefonoRef.current = tienda.telefono;

      const parsed = parsePhoneNumber(tienda.telefono);
      setCountryCode(parsed.code);
      setPhoneNumber(parsed.number);
    }
  }, [isOpen, tienda.telefono]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Handler unificado para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Si estamos editando, pasar el evento y el nombre del campo
    // Si estamos creando, pasar solo el evento
    if (isEditing) {
      onChange(e, name);
    } else {
      onChange(e);
    }
  };

  // Validar formato de teléfono antes de enviar
  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Combinar código de país + número si hay número de teléfono
    const fullPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';

    console.log('📞 Enviando teléfono completo:', fullPhone);

    // Crear evento personalizado con el teléfono
    const customEvent = {
      ...e,
      preventDefault: () => {},
      telefonoCompleto: fullPhone // ← Pasar el teléfono directamente
    };

    onSubmit(customEvent);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              {isEditing ? '✏️ Editar Tienda' : '➕ Agregar Nueva Tienda'}
            </h2>
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
        <div className="p-6">
          {/* Mensaje de error dentro del modal */}
          {modalError && (
            <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {modalError}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setModalError("")}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Nombre de la Tienda *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={tienda.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Tienda Centro"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  required
                />
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Dirección *
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={tienda.direccion}
                  onChange={handleInputChange}
                  placeholder="Calle, Número, Colonia, Ciudad"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  required
                />
              </div>

              {/* Teléfono */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Teléfono
                </label>
                <div className="flex gap-2">
                  {/* Dropdown de código de país */}
                  <div className="relative" style={{ minWidth: '160px' }} ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 flex items-center justify-between"
                      style={{
                        borderColor: '#e5e7eb',
                        '--tw-ring-color': '#23334e'
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span style={{ fontSize: '1.25rem' }}>
                          {countryCodes.find(c => c.code === countryCode)?.flag || '🏳️'}
                        </span>
                        <span className="font-medium" style={{ color: '#23334e' }}>
                          {countryCode}
                        </span>
                      </span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    {showCountryDropdown && (
                      <div
                        className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        style={{ borderColor: '#e5e7eb', top: '100%' }}
                      >
                        {countryCodes.map((country, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setCountryCode(country.code);
                              setShowCountryDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 transition-colors"
                            style={countryCode === country.code ? { backgroundColor: '#f3f4f6' } : {}}
                          >
                            <span style={{ fontSize: '1.25rem' }}>{country.flag}</span>
                            <span className="font-medium" style={{ color: '#23334e' }}>{country.code}</span>
                            <span className="text-sm" style={{ color: '#697487' }}>({country.country})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input para el número */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/\D/g, '');
                      setPhoneNumber(value);
                    }}
                    placeholder="5551234567"
                    className="flex-1 px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      '--tw-ring-color': '#23334e'
                    }}
                    maxLength="15"
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: '#697487' }}>
                  Opcional - Ejemplo: {countryCode} 5551234567
                </p>
              </div>
            </div>

            {/* Info de campos requeridos */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm" style={{ color: '#46546b' }}>
                <span className="font-semibold">* Campos requeridos:</span> Nombre y Dirección
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: cargando ? '#8c95a4' : '#23334e'
                }}
              >
                {cargando ? 'Guardando...' : (isEditing ? 'Actualizar Tienda' : 'Crear Tienda')}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={cargando}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#46546b',
                  backgroundColor: '#f4f6fa'
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TiendaModal;