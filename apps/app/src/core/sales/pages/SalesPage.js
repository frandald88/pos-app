import React, { useState, useEffect } from 'react';
import {
  useSalesData,
  useCart,
  usePayments,
  useClienteSelection,
  useSaleActions
} from '../hooks';
import {
  ProductGrid,
  Cart,
  PaymentSection,
  SuccessModal
} from '../components';
import WeightModal from '../components/WeightModal';
import ErrorModal from '../../../shared/components/ErrorModal';
import { parseWeightBarcode } from '../../../shared/utils/barcodeParser';
import ClienteModal from '../../../modules/clientes/components/ClienteModal';
import clientesService from '../../../modules/clientes/services/clientesService';

export default function SalesPage() {
  // Estados locales
  const [search, setSearch] = useState('');
  const [saleType, setSaleType] = useState('mostrador');
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [manualBarcode, setManualBarcode] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [productForWeight, setProductForWeight] = useState(null);
  const [showTiendasModal, setShowTiendasModal] = useState(false);

  // ⭐ NUEVO: Estados para modal de cliente
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [clienteLoading, setClienteLoading] = useState(false);
  const [clienteError, setClienteError] = useState('');

  // Hooks personalizados
  const {
    products,
    clientes,
    tiendas,
    deliveryUsers,
    userRole,
    tiendaSeleccionada,
    loading,
    error,
    setTiendaSeleccionada,
    reloadClientes // ⭐ NUEVO: Función para recargar clientes
  } = useSalesData();

  const {
    selected,
    discount,
    discountType,
    fixedDiscount,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNote,
    clearCart,
    handleDiscountChange,
    setDiscountType,
    rawSubtotal,
    discountAmount,
    subtotalWithDiscount,
    totalWithTax
  } = useCart();

  const {
    paymentType,
    paymentMethod,
    amountPaid,
    mixedPayments,
    setPaymentType,
    setPaymentMethod,
    setAmountPaid,
    addMixedPayment,
    updateMixedPayment,
    removeMixedPayment,
    clearPayments,
    getRemainingAmount,
    getTotalChange,
    validateMixedPayments
  } = usePayments();

  const {
    clienteSeleccionado,
    clienteFiltro,
    showClienteDropdown,
    filteredClientes,
    selectedClienteInfo,
    setShowClienteDropdown,
    handleClienteFilterChange,
    selectCliente,
    clearClienteSelection,
    getNombreCompleto // ⭐ NUEVO: Helper para nombre completo
  } = useClienteSelection(clientes);

  const {
    msg,
    showSuccessModal,
    showErrorModal,
    errorMessage,
    saleDetails,
    loading: saleLoading,
    handleSale,
    handleQuote,
    closeSuccessModal,
    closeErrorModal,
    setMsg
  } = useSaleActions();

  // Listener para escaneo de código de barras
  useEffect(() => {
    const handleKeyPress = (e) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // Si pasa más de 100ms entre teclas, reiniciar el buffer (es escritura manual)
      if (timeDiff > 100) {
        setBarcodeBuffer(e.key);
      } else {
        setBarcodeBuffer(prev => prev + e.key);
      }

      setLastKeyTime(currentTime);

      // Si presiona Enter, buscar el producto
      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        e.preventDefault();
        const barcode = barcodeBuffer;

        // Verificar si es un código de barras con peso integrado
        const weightBarcodeData = parseWeightBarcode(barcode);

        if (weightBarcodeData.isWeightBarcode) {
          // Es un código con peso integrado (Escenario 1)
          console.log('📦 Código con peso detectado:', weightBarcodeData);

          // Buscar producto por el código del producto (5 dígitos)
          const product = products.find(p =>
            p.sku === weightBarcodeData.searchCode ||
            p.barcode === weightBarcodeData.searchCode
          );

          if (product) {
            // Agregar al carrito con el peso del código de barras
            addToCart({
              ...product,
              qty: weightBarcodeData.weight,
              isWeightProduct: true,
              weightUnit: product.weightUnit || 'kg',
              originalPrice: product.price,
              total: weightBarcodeData.weight * product.price
            });
            setMsg(`✅ ${product.name} - ${weightBarcodeData.weight} ${product.weightUnit || 'kg'} agregado`);
            setTimeout(() => setMsg(''), 2500);
          } else {
            setMsg(`❌ Producto no encontrado. Código: ${weightBarcodeData.searchCode}`);
            setTimeout(() => setMsg(''), 3000);
          }
        } else {
          // Búsqueda normal de código de barras
          const product = products.find(p => p.barcode === barcode);

          if (product) {
            // Verificar si es un producto que se vende por peso (Escenario 2)
            if (product.soldByWeight) {
              // Mostrar modal para captura manual
              setProductForWeight(product);
              setShowWeightModal(true);
            } else {
              // Producto normal
              addToCart(product);
              setMsg(`✅ Producto "${product.name}" agregado al carrito`);
              setTimeout(() => setMsg(''), 2000);
            }
          } else {
            setMsg(`❌ No se encontró producto con código de barras: ${barcode}`);
            setTimeout(() => setMsg(''), 3000);
          }
        }

        setBarcodeBuffer('');
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [barcodeBuffer, lastKeyTime, products, addToCart, setMsg]);

  // Manejar búsqueda manual por código de barras
  const handleManualBarcodeSearch = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    const product = products.find(p => p.barcode === manualBarcode.trim());

    if (product) {
      addToCart(product);
      setMsg(`✅ Producto "${product.name}" agregado al carrito`);
      setTimeout(() => setMsg(''), 2000);
      setManualBarcode(''); // Limpiar campo
    } else {
      setMsg(`❌ No se encontró producto con código de barras: ${manualBarcode}`);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  // ⭐ NUEVO: Manejar cambios en formulario de cliente
  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ⭐ NUEVO: Crear nuevo cliente
  const handleCreateCliente = async (e) => {
    e.preventDefault();
    setClienteLoading(true);
    setClienteError('');

    try {
      // Validar teléfono
      if (nuevoCliente.telefono.length !== 10 || !/^\d+$/.test(nuevoCliente.telefono)) {
        setClienteError('El teléfono debe tener exactamente 10 dígitos');
        setClienteLoading(false);
        return;
      }

      const response = await clientesService.createCliente(nuevoCliente);

      if (response.success) {
        // Recargar lista de clientes
        await reloadClientes();

        // Seleccionar el nuevo cliente creado
        const clienteCreado = response.data.cliente;

        // Esperar un momento para que se actualice la lista de clientes
        setTimeout(() => {
          // Buscar el cliente en la lista actualizada
          const clienteEnLista = clientes.find(c => c._id === clienteCreado._id);
          if (clienteEnLista) {
            selectCliente(clienteEnLista);
          } else {
            // Si no está en la lista aún, crear objeto temporal
            selectCliente({
              _id: clienteCreado._id,
              nombre: clienteCreado.nombre,
              telefono: clienteCreado.telefono,
              email: clienteCreado.email || '',
              direccion: clienteCreado.direccion || ''
            });
          }
        }, 100);

        // Cerrar modal y limpiar
        setShowClienteModal(false);
        setNuevoCliente({
          nombre: '',
          primerApellido: '',
          segundoApellido: '',
          telefono: '',
          email: '',
          direccion: ''
        });

        // ⭐ Construir nombre completo para mostrar
        const nombreCompleto = `${clienteCreado.nombre} ${clienteCreado.primerApellido || ''} ${clienteCreado.segundoApellido || ''}`.trim();
        setMsg(`✅ Cliente "${nombreCompleto}" creado y seleccionado exitosamente`);
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setClienteError(error.response?.data?.message || 'Error al crear el cliente');
    } finally {
      setClienteLoading(false);
    }
  };

  // ⭐ NUEVO: Abrir modal de cliente
  const openClienteModal = () => {
    setShowClienteModal(true);
    setClienteError('');
    setNuevoCliente({
      nombre: '',
      primerApellido: '',
      segundoApellido: '',
      telefono: '',
      email: '',
      direccion: ''
    });
  };

  // Manejar venta
  const onHandleSale = () => {
    const items = selected.map((p) => ({
      productId: p._id.startsWith('custom-') ? null : p._id,
      quantity: p.qty,
      price: p.price,
      name: p.name,
      note: p.note || ''
    }));

    // Buscar información completa de la tienda incluyendo ticketConfig
    const tiendaCompleta = tiendas.find(t => t._id === tiendaSeleccionada);

    // ⭐ VALIDACIÓN: Venta a domicilio requiere cliente con dirección
    if (saleType === 'domicilio') {
      if (!clienteSeleccionado || !selectedClienteInfo) {
        setMsg('⚠️ Las ventas a domicilio requieren seleccionar un cliente');
        return;
      }
      if (!selectedClienteInfo.direccion || selectedClienteInfo.direccion.trim() === '') {
        setMsg('⚠️ El cliente seleccionado no tiene dirección registrada. Por favor actualiza los datos del cliente.');
        return;
      }
    }

    // 🐛 DEBUG: Verificar datos del cliente
    console.log('🔍 selectedClienteInfo completo:', selectedClienteInfo);
    console.log('🔍 Cliente tiene dirección?:', selectedClienteInfo?.direccion);
    console.log('🔍 Tipo de venta:', saleType);

    const saleData = {
      items,
      total: totalWithTax,
      discount: discountAmount,
      paymentType,
      cliente: clienteSeleccionado || null,
      type: saleType,
      tienda: tiendaSeleccionada, // ID para backend
      tiendaCompleta, // Objeto completo para el ticket
      deliveryPerson: saleType === 'domicilio' ? deliveryPerson : null,
      clienteNombre: selectedClienteInfo?.nombre || 'Cliente general',
      clienteDetalle: selectedClienteInfo || null, // ⭐ Objeto completo del cliente con dirección
      // Datos para validaciones
      tiendaSeleccionada,
      saleType,
      paymentMethod,
      amountPaid,
      totalWithTax,
      mixedPayments,
      validateMixedPayments
    };

    // Agregar datos específicos del tipo de pago
    if (paymentType === 'single') {
      saleData.method = paymentMethod;
    } else {
      saleData.mixedPayments = mixedPayments.map(payment => ({
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference || '',
        receivedAmount: payment.method === 'efectivo' ? parseFloat(payment.receivedAmount) || payment.amount : undefined
      }));
    }

    handleSale(saleData, {
      getTotalChange,
      onSuccess: () => {
        clearCart();
        clearPayments();
        clearClienteSelection();
        setDeliveryPerson('');
        setSaleType('mostrador');
      }
    });
  };

  // Manejar cotización
  const onHandleQuote = () => {
    const quoteData = {
      products: selected,
      clienteId: clienteSeleccionado,
      tienda: tiendaSeleccionada,
      discount: discountType === 'percentage' ? discountAmount : fixedDiscount,
      tiendaSeleccionada
    };

    handleQuote(quoteData);
  };

  // Función auxiliar para cambiar de tienda con validación
  const cambiarTienda = (newTienda) => {
    // Si hay productos en el carrito y se está cambiando de tienda, mostrar confirmación
    // Incluye el caso cuando tiendaSeleccionada está vacía/null pero hay productos
    const estaCambiandoDeTienda = tiendaSeleccionada && newTienda !== tiendaSeleccionada;
    const tieneProductosYVaASeleccionarTienda = !tiendaSeleccionada && selected.length > 0 && newTienda;

    if (selected.length > 0 && (estaCambiandoDeTienda || tieneProductosYVaASeleccionarTienda)) {
      const confirmar = window.confirm(
        'Al cambiar de tienda se eliminarán todos los productos del carrito. ¿Deseas continuar?'
      );

      if (!confirmar) {
        return false; // Cancelar el cambio de tienda
      }

      // Limpiar carrito y pagos
      clearCart();
      clearPayments();
      clearClienteSelection();
    }

    setTiendaSeleccionada(newTienda);
    setDeliveryPerson(''); // Limpiar repartidor seleccionado

    // Disparar evento personalizado para que AdminLayout actualice el turno
    // Solo si efectivamente se seleccionó una tienda
    if (newTienda) {
      window.dispatchEvent(new CustomEvent('tiendaChanged', { detail: { tiendaId: newTienda } }));
    }

    return true;
  };

  // Manejar cambio en tienda desde select
  const handleTiendaChange = (e) => {
    cambiarTienda(e.target.value);
  };

  if (loading && !products.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Cargando datos...</p>
        </div>
      </div>
    );
  }

  // Handler para agregar productos - con soporte para peso
  const handleAddToCart = (product) => {
    // Si el producto se vende por peso, mostrar modal
    if (product.soldByWeight) {
      setProductForWeight(product);
      setShowWeightModal(true);
    } else {
      // Producto normal
      addToCart(product);
    }
  };

  // Handler para confirmar peso del modal
  const handleWeightConfirm = (productWithWeight) => {
    addToCart(productWithWeight);
    setMsg(`✅ ${productWithWeight.name} - ${productWithWeight.qty} ${productWithWeight.weightUnit} agregado`);
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Columna 1: Productos (70%) */}
      <div className="flex-1 flex flex-col">
        {/* Header con tienda y búsqueda por código de barras */}
        <div className="px-4 py-3 border-b-2 shadow-sm" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottomColor: '#e2e8f0' }}>
          <div className="flex gap-3">
            {/* Tienda (si es admin) */}
            {userRole === 'admin' && (
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#23334e' }}>
                  🏪 Tienda
                </label>
                <div className="flex flex-wrap gap-2">
                  {/* Mostrar primeras 3 tiendas */}
                  {tiendas.slice(0, 3).map((t) => (
                    <button
                      key={t._id}
                      onClick={() => cambiarTienda(t._id)}
                      className={`px-3 py-2.5 text-sm font-semibold rounded-lg border-2 shadow-sm transition-all hover:shadow-md active:scale-95 ${
                        tiendaSeleccionada === t._id ? 'text-white' : ''
                      }`}
                      style={
                        tiendaSeleccionada === t._id
                          ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                          : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                      }
                    >
                      {t.nombre}
                    </button>
                  ))}

                  {/* Botón + si hay más de 3 tiendas - abre modal */}
                  {tiendas.length > 3 && (
                    <button
                      onClick={() => setShowTiendasModal(true)}
                      className="px-3 py-2.5 text-sm font-bold rounded-lg border-2 shadow-sm transition-all hover:shadow-md active:scale-95"
                      style={{
                        color: '#697487',
                        backgroundColor: 'white',
                        borderColor: '#cbd5e1'
                      }}
                      title="Ver todas las tiendas"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Búsqueda por código de barras */}
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#23334e' }}>
                📦 Código de Barras
              </label>
              <form onSubmit={handleManualBarcodeSearch} className="flex gap-2">
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Escanea o escribe..."
                  className="flex-1 px-3 py-2.5 text-sm font-medium border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all hover:shadow-md"
                  style={{
                    '--tw-ring-color': '#46546b',
                    color: '#23334e',
                    borderColor: '#cbd5e1',
                    backgroundColor: 'white'
                  }}
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg font-semibold text-white text-sm shadow-md transition-all hover:shadow-lg active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  🔍 Buscar
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Grid de productos */}
        <div className="flex-1 overflow-hidden">
          <ProductGrid
            products={products}
            search={search}
            setSearch={setSearch}
            onAddToCart={handleAddToCart}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>
      </div>

      {/* Columna 2: Carrito (15%) */}
      <div className="w-80 border-l border-gray-200 flex flex-col h-screen" style={{ backgroundColor: 'white' }}>
        {/* Header del carrito - compacto */}
        <div className="px-3 py-2 text-white" style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">🛒 Carrito</h2>
            <span className="bg-white text-gray-800 px-2 py-0.5 rounded-full text-xs font-bold">{selected.length}</span>
          </div>
        </div>

        {/* Items del carrito - scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <Cart
            cartItems={selected}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onUpdateNote={updateNote}
          />
        </div>

        {/* Totales - fijo abajo */}
        {selected.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200 px-3 py-2" style={{ backgroundColor: '#f4f6fa' }}>
            {/* Descuento compacto */}
            <div className="mb-2">
              <div className="flex gap-2">
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none"
                  style={{ color: '#23334e' }}
                >
                  <option value="percentage">% Descuento</option>
                  <option value="fixed">$ Descuento</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountType === 'percentage' ? (discount === 0 ? '' : discount) : (fixedDiscount === 0 ? '' : fixedDiscount)}
                  onChange={(e) => handleDiscountChange(e.target.value, discountType, rawSubtotal, setMsg)}
                  placeholder="0"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none"
                  style={{ color: '#23334e' }}
                />
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#697487' }}>Subtotal:</span>
                <span style={{ color: '#23334e' }}>${rawSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#697487' }}>Descuento:</span>
                <span style={{ color: '#ef4444' }}>-${discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-1 mt-1">
                <span style={{ color: '#23334e' }}>TOTAL:</span>
                <span style={{ color: '#10b981' }}>${totalWithTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Columna 3: Checkout (15%) */}
      {selected.length > 0 && (
        <div className="w-80 border-l border-gray-200 flex flex-col h-screen overflow-y-auto" style={{ backgroundColor: '#f4f6fa' }}>
          {/* Header */}
          <div className="px-3 py-2 text-white" style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}>
            <h2 className="text-base font-bold">💳 Pago</h2>
          </div>

          <div className="p-3 space-y-2.5">
            {/* Cliente */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium" style={{ color: '#23334e' }}>👤 Cliente</label>
                <button
                  onClick={openClienteModal}
                  className="px-2 py-1 text-xs font-semibold rounded transition-all hover:shadow-md active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)',
                    color: 'white'
                  }}
                  title="Agregar nuevo cliente"
                >
                  + Nuevo
                </button>
              </div>
              <input
                type="text"
                value={clienteFiltro}
                onChange={handleClienteFilterChange}
                onFocus={() => setShowClienteDropdown(true)}
                onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                placeholder="Buscar..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#46546b', color: '#23334e' }}
              />

              {/* Dropdown de clientes */}
              {showClienteDropdown && clienteFiltro && filteredClientes.length > 0 && (
                <div className="absolute z-20 w-full mt-1 border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto" style={{ backgroundColor: 'white' }}>
                  {filteredClientes.map((cliente) => (
                    <div
                      key={cliente._id}
                      onClick={() => selectCliente(cliente)}
                      className={`p-2 cursor-pointer transition-colors ${clienteSeleccionado === cliente._id ? 'border-l-4' : ''}`}
                      style={clienteSeleccionado === cliente._id ? { backgroundColor: '#f4f6fa', borderLeftColor: '#46546b' } : {}}
                    >
                      <p className="font-medium text-xs" style={{ color: '#23334e' }}>{getNombreCompleto(cliente)}</p>
                      <p className="text-xs" style={{ color: '#8c95a4' }}>{cliente.telefono}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sección de pagos */}
            <PaymentSection
              paymentType={paymentType}
              setPaymentType={setPaymentType}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
              totalWithTax={totalWithTax}
              mixedPayments={mixedPayments}
              onAddMixedPayment={addMixedPayment}
              onUpdateMixedPayment={updateMixedPayment}
              onRemoveMixedPayment={removeMixedPayment}
              getRemainingAmount={() => getRemainingAmount(totalWithTax)}
              getTotalChange={getTotalChange}
            />

            {/* Tipo de venta */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>🏷️ Tipo de venta</label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSaleType('mostrador')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                    saleType === 'mostrador' ? 'text-white' : ''
                  }`}
                  style={
                    saleType === 'mostrador'
                      ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                      : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                  }
                >
                  🏪 Mostrador
                </button>
                <button
                  onClick={() => setSaleType('recoger')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                    saleType === 'recoger' ? 'text-white' : ''
                  }`}
                  style={
                    saleType === 'recoger'
                      ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                      : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                  }
                >
                  📦 A recoger
                </button>
                <button
                  onClick={() => setSaleType('domicilio')}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                    saleType === 'domicilio' ? 'text-white' : ''
                  }`}
                  style={
                    saleType === 'domicilio'
                      ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                      : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                  }
                >
                  🚚 A domicilio
                </button>
              </div>

              {/* ⭐ NUEVO: Mensaje de ayuda para ventas a domicilio */}
              {saleType === 'domicilio' && (
                <div className="mt-3 p-3 rounded-lg border-l-4" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div className="text-xs" style={{ color: '#92400e' }}>
                      <strong>Requerido:</strong> Debes seleccionar un cliente con dirección registrada.
                      {(!clienteSeleccionado || !selectedClienteInfo?.direccion) && (
                        <div className="mt-1 font-semibold" style={{ color: '#dc2626' }}>
                          {!clienteSeleccionado ? '❌ No hay cliente seleccionado' : '❌ El cliente no tiene dirección'}
                        </div>
                      )}
                      {clienteSeleccionado && selectedClienteInfo?.direccion && (
                        <div className="mt-1 font-semibold" style={{ color: '#059669' }}>
                          ✅ Cliente: {getNombreCompleto(selectedClienteInfo)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Repartidor - REMOVIDO: Ya no se asigna en la venta, se asigna después por disponibilidad */}
            {/* {saleType === 'domicilio' && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#23334e' }}>🚴 Repartidor</label>
                <select
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': '#46546b', color: '#23334e' }}
                >
                  <option value="">-- Seleccionar --</option>
                  {deliveryUsers.map((user) => (
                    <option key={user._id} value={user._id}>{user.username}</option>
                  ))}
                </select>
              </div>
            )} */}

            {/* Botones */}
            <div className="space-y-2 pt-2">
              <button
                onClick={onHandleSale}
                disabled={!selected.length || !tiendaSeleccionada || (paymentType === 'mixed' && getRemainingAmount(totalWithTax) > 0) || saleLoading}
                className="w-full text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg"
                style={{
                  background: (!selected.length || !tiendaSeleccionada || (paymentType === 'mixed' && getRemainingAmount(totalWithTax) > 0) || saleLoading)
                    ? '#8c95a4'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                ✓ {saleLoading ? 'Procesando...' : 'COBRAR'}
              </button>

              <button
                onClick={onHandleQuote}
                disabled={!selected.length || !tiendaSeleccionada || saleLoading}
                className="w-full text-white py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: (!selected.length || !tiendaSeleccionada || saleLoading) ? '#8c95a4' : 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
              >
                📄 Cotización
              </button>
            </div>

            {/* Mensaje */}
            {msg && (
              <div className={`p-2 rounded-lg text-xs font-medium text-center ${msg.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {msg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      <SuccessModal
        isOpen={showSuccessModal}
        saleDetails={saleDetails}
        onClose={closeSuccessModal}
      />

      {/* Modal de error */}
      {showErrorModal && (
        <ErrorModal
          message={errorMessage}
          onClose={closeErrorModal}
          autoCloseSeconds={10}
        />
      )}

      {/* ⭐ NUEVO: Modal de crear cliente */}
      <ClienteModal
        isOpen={showClienteModal}
        onClose={() => setShowClienteModal(false)}
        onSubmit={handleCreateCliente}
        cliente={nuevoCliente}
        onChange={handleClienteChange}
        isEditing={false}
        cargando={clienteLoading}
        modalError={clienteError}
        setModalError={setClienteError}
      />

      {/* Modal de peso */}
      <WeightModal
        isOpen={showWeightModal}
        product={productForWeight}
        onConfirm={handleWeightConfirm}
        onClose={() => {
          setShowWeightModal(false);
          setProductForWeight(null);
        }}
      />

      {/* Modal de tiendas */}
      {showTiendasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowTiendasModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-2xl w-full transform transition-all max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b-2" style={{ borderBottomColor: '#e2e8f0' }}>
              <h3 className="text-2xl font-bold" style={{ color: '#23334e' }}>
                🏪 Seleccionar Tienda
              </h3>
              <button
                onClick={() => setShowTiendasModal(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-100"
                style={{ color: '#8c95a4' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Grid de tiendas - scrollable */}
            <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tiendas.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => {
                      if (cambiarTienda(t._id)) {
                        setShowTiendasModal(false);
                      }
                    }}
                    className={`p-4 rounded-lg border-2 shadow-sm transition-all hover:shadow-md active:scale-95 text-left ${
                      tiendaSeleccionada === t._id ? 'text-white' : ''
                    }`}
                    style={
                      tiendaSeleccionada === t._id
                        ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                        : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={
                          tiendaSeleccionada === t._id
                            ? { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                            : { backgroundColor: '#f1f5f9' }
                        }
                      >
                        🏪
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-base">{t.nombre}</h4>
                        {tiendaSeleccionada === t._id && (
                          <p className="text-xs mt-1 opacity-90">✓ Seleccionada</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer con info */}
            <div className="mt-4 pt-4 border-t-2" style={{ borderTopColor: '#e2e8f0' }}>
              <p className="text-sm text-center" style={{ color: '#697487' }}>
                Total de tiendas: <span className="font-bold" style={{ color: '#23334e' }}>{tiendas.length}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}