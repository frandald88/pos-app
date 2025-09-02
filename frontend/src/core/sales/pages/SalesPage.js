import React, { useState } from 'react';
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

export default function SalesPage() {
  // Estados locales
  const [search, setSearch] = useState('');
  const [saleType, setSaleType] = useState('mostrador');
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

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
    setTiendaSeleccionada
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
    clearClienteSelection
  } = useClienteSelection(clientes);

  const {
    msg,
    showSuccessModal,
    saleDetails,
    loading: saleLoading,
    handleSale,
    handleQuote,
    closeSuccessModal,
    setMsg
  } = useSaleActions();

  // Manejar venta
  const onHandleSale = () => {
    const items = selected.map((p) => ({
      productId: p._id.startsWith('custom-') ? null : p._id,
      quantity: p.qty,
      price: p.price,
      name: p.name,
      note: p.note || ''
    }));

    const saleData = {
      items,
      total: totalWithTax,
      discount: discountAmount,
      paymentType,
      cliente: clienteSeleccionado || null,
      type: saleType,
      tienda: tiendaSeleccionada,
      deliveryPerson: saleType === 'domicilio' ? deliveryPerson : null,
      clienteNombre: selectedClienteInfo?.nombre || 'Cliente general',
      // Datos para validaciones
      tiendaSeleccionada,
      saleType,
      deliveryPerson,
      paymentType,
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

  // Manejar cambio en tienda
  const handleTiendaChange = (e) => {
    const newTienda = e.target.value;
    setTiendaSeleccionada(newTienda);
    setDeliveryPerson(''); // Limpiar repartidor seleccionado
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

  return (
    <div className="flex h-full" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Panel izquierdo - Productos */}
      <ProductGrid 
        products={products}
        search={search}
        setSearch={setSearch}
        onAddToCart={addToCart}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {/* Panel derecho - Carrito y Checkout */}
      <div className="w-96 rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden" style={{ backgroundColor: '#f4f6fa' }}>
        {/* Header del carrito */}
        <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Carrito de Compras</h2>
              <p className="text-sm opacity-80">{selected.length} artículos</p>
            </div>
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 8M7 13l2.5 8m0 0L17 17M9.5 21h8" />
              </svg>
              {selected.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 text-white text-xs rounded-full flex items-center justify-center" style={{ backgroundColor: '#23334e' }}>
                  {selected.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Configuración de tienda */}
        {userRole === 'admin' && (
          <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tienda
            </label>
            <select
              value={tiendaSeleccionada}
              onChange={handleTiendaChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ 
                '--tw-ring-color': '#46546b',
                color: '#23334e'
              }}
            >
              <option value="">-- Selecciona tienda --</option>
              {tiendas.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items del carrito */}
        <div className="flex-1 overflow-y-auto">
          <Cart 
            cartItems={selected}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            onUpdateNote={updateNote}
          />
        </div>

        {/* Panel de checkout */}
        {selected.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4" style={{ backgroundColor: '#f4f6fa' }}>
            {/* Cliente */}
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Cliente
              </label>
              <input
                type="text"
                value={clienteFiltro}
                onChange={handleClienteFilterChange}
                onFocus={() => setShowClienteDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowClienteDropdown(false), 200);
                }}
                placeholder="Buscar cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': '#46546b',
                  color: '#23334e'
                }}
              />
              
              {/* Dropdown de clientes */}
              {showClienteDropdown && clienteFiltro && filteredClientes.length > 0 && (
                <div className="absolute z-20 w-full mt-1 border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto" style={{ backgroundColor: 'white' }}>
                  {filteredClientes.map((cliente) => (
                    <div
                      key={cliente._id}
                      onClick={() => selectCliente(cliente)}
                      className={`p-2 cursor-pointer transition-colors duration-200 ${
                        clienteSeleccionado === cliente._id ? 'border-l-4' : ''
                      }`}
                      style={clienteSeleccionado === cliente._id 
                        ? { backgroundColor: '#f4f6fa', borderLeftColor: '#46546b' }
                        : {}
                      }
                    >
                      <p className="font-medium text-sm" style={{ color: '#23334e' }}>{cliente.nombre}</p>
                      <p className="text-xs" style={{ color: '#8c95a4' }}>{cliente.telefono}</p>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => window.location.href = '/admin/clientes'}
                className="mt-2 text-sm transition-colors duration-200"
                style={{ color: '#46546b' }}
              >
                + Agregar nuevo cliente
              </button>
            </div>

            {/* Descuento */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#23334e' }}>Tipo descuento</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    '--tw-ring-color': '#46546b',
                    color: '#23334e'
                  }}
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo ($)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#23334e' }}>
                  {discountType === 'percentage' ? 'Porcentaje' : 'Monto'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountType === 'percentage' ? (discount === 0 ? '' : discount) : (fixedDiscount === 0 ? '' : fixedDiscount)}
                  onChange={(e) => handleDiscountChange(e.target.value, discountType, rawSubtotal, setMsg)}
                  placeholder={discountType === 'percentage' ? '10' : '100'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    '--tw-ring-color': '#46546b',
                    color: '#23334e'
                  }}
                />
              </div>
            </div>

            {/* Totales */}
            <div className="rounded-lg p-3 border border-gray-200" style={{ backgroundColor: 'white' }}>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#697487' }}>Subtotal:</span>
                  <span style={{ color: '#23334e' }}>${rawSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: '#697487' }}>
                  <span>Descuento:</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span style={{ color: '#23334e' }}>Total:</span>
                  <span style={{ color: '#46546b' }}>${totalWithTax.toFixed(2)}</span>
                </div>
              </div>
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
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>Tipo de venta</label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': '#46546b',
                  color: '#23334e'
                }}
              >
                <option value="mostrador">🏪 Mostrador</option>
                <option value="recoger">📦 A recoger</option>
                <option value="domicilio">🚚 A domicilio</option>
              </select>
            </div>

            {/* Repartidor para domicilio */}
            {saleType === 'domicilio' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>Repartidor</label>
                <select
                  value={deliveryPerson}
                  onChange={(e) => setDeliveryPerson(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    '--tw-ring-color': '#46546b',
                    color: '#23334e'
                  }}
                >
                  <option value="">-- Selecciona repartidor --</option>
                  {deliveryUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botones de acción */}
            <div className="space-y-2">
              <button
                onClick={onHandleSale}
                disabled={!selected.length || !tiendaSeleccionada || (paymentType === 'mixed' && getRemainingAmount(totalWithTax) > 0) || saleLoading}
                className="w-full text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                style={{ 
                  background: (!selected.length || !tiendaSeleccionada || (paymentType === 'mixed' && getRemainingAmount(totalWithTax) > 0) || saleLoading) 
                    ? '#8c95a4' 
                    : 'linear-gradient(135deg, #697487 0%, #46546b 100%)'
                }}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {saleLoading ? 'Registrando...' : 'Registrar Venta'}
              </button>
              
              <button
                onClick={onHandleQuote}
                disabled={!selected.length || !tiendaSeleccionada || saleLoading}
                className="w-full text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                style={{ 
                  background: (!selected.length || !tiendaSeleccionada || saleLoading) ? '#8c95a4' : 'linear-gradient(135deg, #46546b 0%, #23334e 100%)'
                }}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Generar Cotización
              </button>
            </div>

            {/* Mensaje de estado */}
            {msg && (
              <div className={`p-3 rounded-lg text-sm font-medium text-center border ${
                msg.includes('✅') 
                  ? 'border-green-200' 
                  : 'border-red-200'
              }`}
              style={msg.includes('✅') 
                ? { backgroundColor: '#f0f9f4', color: '#166534' }
                : { backgroundColor: '#fef2f2', color: '#dc2626' }
              }>
                {msg}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de éxito */}
      <SuccessModal 
        isOpen={showSuccessModal}
        saleDetails={saleDetails}
        onClose={closeSuccessModal}
      />
    </div>
  );
}