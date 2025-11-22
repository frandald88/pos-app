import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAccountById,
  addOrderToAccount,
  applyDiscount,
  applyTip,
  generatePreliminaryTicket,
  configureSplit,
  paySplit,
  payAccount,
  closeAccount,
  cancelAccount
} from '../services/accountsService';
import { productService } from '../../products/services/productService';

const AccountPage = () => {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPreliminaryTicket, setShowPreliminaryTicket] = useState(false);

  // Form states
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [tipData, setTipData] = useState({ type: 'percentage', amount: 0 });
  const [splits, setSplits] = useState([]);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    cashReceived: 0,
    cardAmount: 0,
    transferAmount: 0
  });
  const [preliminaryTicketData, setPreliminaryTicketData] = useState(null);

  const tiendaId = localStorage.getItem('tiendaId');

  useEffect(() => {
    loadAccount();
    loadProducts();
  }, [accountId]);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await getAccountById(accountId);
      setAccount(data.data.account);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const products = await productService.getAllProducts(token);
      setProducts(products || []);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const handleAddProducts = () => {
    setShowProductsModal(true);
    setSelectedProducts([]);
    setSearchTerm('');
  };

  const handleProductSelect = (product) => {
    const existing = selectedProducts.find((p) => p.productId === product._id);
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === product._id ? { ...p, quantity: p.quantity + 1 } : p
        )
      );
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product._id,
          name: product.nombre,
          price: product.precioVenta,
          quantity: 1
        }
      ]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.productId === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleSubmitOrder = async () => {
    if (selectedProducts.length === 0) {
      setError('Selecciona al menos un producto');
      return;
    }

    try {
      await addOrderToAccount(accountId, selectedProducts);
      setSuccess('Orden agregada exitosamente');
      setShowProductsModal(false);
      setSelectedProducts([]);
      loadAccount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar orden');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleApplyDiscount = async () => {
    try {
      await applyDiscount(accountId, parseFloat(discountAmount));
      setSuccess('Descuento aplicado');
      setShowDiscountModal(false);
      setDiscountAmount(0);
      loadAccount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aplicar descuento');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleApplyTip = async () => {
    try {
      await applyTip(accountId, tipData);
      setSuccess('Propina aplicada');
      setShowTipModal(false);
      loadAccount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aplicar propina');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleGeneratePreliminary = async () => {
    try {
      const data = await generatePreliminaryTicket(accountId);
      setPreliminaryTicketData(data.data.ticket);
      setShowPreliminaryTicket(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar ticket');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCloseAccount = async () => {
    if (!window.confirm('¿Solicitar la cuenta? Esto preparará la cuenta para pago.')) return;

    try {
      await closeAccount(accountId);
      setSuccess('Cuenta cerrada. Lista para pago.');
      loadAccount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar cuenta');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handlePayFull = async () => {
    try {
      const payment = {
        paymentMethod: paymentData.paymentMethod
      };

      if (paymentData.paymentMethod === 'cash') {
        payment.cashReceived = parseFloat(paymentData.cashReceived);
      } else if (paymentData.paymentMethod === 'mixed') {
        payment.cashAmount = parseFloat(paymentData.cashReceived) || 0;
        payment.cardAmount = parseFloat(paymentData.cardAmount) || 0;
        payment.transferAmount = parseFloat(paymentData.transferAmount) || 0;
      }

      await payAccount(accountId, payment);
      setSuccess('Cuenta pagada exitosamente');
      setShowPaymentModal(false);
      setTimeout(() => {
        navigate('/restaurant/tables');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar pago');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleCancelAccount = async () => {
    const reason = window.prompt('Motivo de cancelación:');
    if (!reason) return;

    try {
      await cancelAccount(accountId, reason);
      setSuccess('Cuenta cancelada');
      setTimeout(() => {
        navigate('/restaurant/tables');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar cuenta');
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getAllItems = () => {
    if (!account || !account.orders) return [];
    return account.orders.flatMap((order, orderIdx) =>
      order.items.map((item, itemIdx) => ({
        ...item,
        orderIdx,
        itemIdx,
        orderNumber: order.orderNumber
      }))
    );
  };

  const activeItems = getAllItems().filter((item) => item.status !== 'cancelled');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Cargando cuenta...</div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Cuenta no encontrada</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Cuenta #{account.folio} - Mesa {account.tableId?.number}
          </h1>
          <p className="text-gray-600 mt-1">
            Estado: <span className="font-medium">{getStatusText(account.status)}</span>
          </p>
        </div>
        <button
          onClick={() => navigate('/restaurant/tables')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          ← Volver
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Órdenes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Órdenes</h2>
              {account.status === 'open' && (
                <button
                  onClick={handleAddProducts}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Agregar Productos
                </button>
              )}
            </div>

            {activeItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay productos en la cuenta
              </div>
            ) : (
              <div className="space-y-2">
                {activeItems.map((item, idx) => (
                  <div
                    key={`${item.orderIdx}-${item.itemIdx}`}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Cantidad: {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                      {item.note && (
                        <div className="text-xs text-gray-500 italic">Nota: {item.note}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        Orden #{item.orderNumber} - {getItemStatusText(item.status)}
                      </div>
                    </div>
                    <div className="text-right font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho - Totales y Acciones */}
        <div className="space-y-6">
          {/* Resumen */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Resumen</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${account.subtotal.toFixed(2)}</span>
              </div>
              {account.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span className="font-medium">-${account.discount.toFixed(2)}</span>
                </div>
              )}
              {account.tip && account.tip.amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Propina:</span>
                  <span className="font-medium">${account.tip.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${account.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Acciones</h2>
            <div className="space-y-2">
              {account.status === 'open' && (
                <>
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Aplicar Descuento
                  </button>
                  <button
                    onClick={() => setShowTipModal(true)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Aplicar Propina
                  </button>
                  <button
                    onClick={handleGeneratePreliminary}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Ticket Preliminar
                  </button>
                  <button
                    onClick={handleCloseAccount}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Solicitar Cuenta
                  </button>
                </>
              )}

              {(account.status === 'closed_pending' || account.status === 'open') && (
                <>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Pagar Cuenta Completa
                  </button>
                  <button
                    onClick={() => setShowSplitModal(true)}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Dividir Cuenta
                  </button>
                </>
              )}

              <button
                onClick={handleCancelAccount}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Agregar Productos */}
      {showProductsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Agregar Productos</h2>

              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 max-h-60 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductSelect(product)}
                    className="p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all"
                  >
                    <div className="font-medium">{product.nombre}</div>
                    <div className="text-sm text-gray-600">${product.precioVenta.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {selectedProducts.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">Productos Seleccionados:</h3>
                  <div className="space-y-2 mb-4">
                    {selectedProducts.map((item) => (
                      <div
                        key={item.productId}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">{item.name}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemoveProduct(item.productId)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowProductsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitOrder}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  disabled={selectedProducts.length === 0}
                >
                  Agregar Orden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Descuento */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Aplicar Descuento</h2>
            <input
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="Monto del descuento"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscountModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Propina */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Aplicar Propina</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Propina</label>
              <select
                value={tipData.type}
                onChange={(e) => setTipData({ ...tipData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="percentage">Porcentaje</option>
                <option value="fixed">Monto Fijo</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {tipData.type === 'percentage' ? 'Porcentaje (%)' : 'Monto ($)'}
              </label>
              <input
                type="number"
                min="0"
                step={tipData.type === 'percentage' ? '1' : '0.01'}
                value={tipData.amount}
                onChange={(e) => setTipData({ ...tipData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {tipData.type === 'percentage' && (
              <div className="mb-4 flex gap-2">
                {[10, 15, 20].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setTipData({ ...tipData, amount: percent })}
                    className="flex-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyTip}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ticket Preliminar */}
      {showPreliminaryTicket && preliminaryTicketData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">Ticket Preliminar</h2>

            <div className="border-t border-b py-4 mb-4 space-y-2">
              <div className="text-center">
                <div className="font-bold">Cuenta #{preliminaryTicketData.folio}</div>
                <div className="text-sm">Mesa: {preliminaryTicketData.mesa}</div>
                <div className="text-sm">Mesero: {preliminaryTicketData.mesero}</div>
                <div className="text-sm">{new Date(preliminaryTicketData.fecha).toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {preliminaryTicketData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div>
                    {item.quantity} × {item.name}
                  </div>
                  <div>${(item.quantity * item.price).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${preliminaryTicketData.subtotal.toFixed(2)}</span>
              </div>
              {preliminaryTicketData.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-${preliminaryTicketData.discount.toFixed(2)}</span>
                </div>
              )}
              {preliminaryTicketData.propina > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Propina:</span>
                  <span>${preliminaryTicketData.propina.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${preliminaryTicketData.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPreliminaryTicket(false)}
              className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Procesar Pago</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Método de Pago</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="mixed">Mixto</option>
              </select>
            </div>

            {paymentData.paymentMethod === 'cash' && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Efectivo Recibido</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentData.cashReceived}
                  onChange={(e) => setPaymentData({ ...paymentData, cashReceived: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                {paymentData.cashReceived > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    Cambio: ${(parseFloat(paymentData.cashReceived) - account.total).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {paymentData.paymentMethod === 'mixed' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Efectivo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentData.cashReceived}
                    onChange={(e) => setPaymentData({ ...paymentData, cashReceived: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Tarjeta</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentData.cardAmount}
                    onChange={(e) => setPaymentData({ ...paymentData, cardAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Transferencia</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentData.transferAmount}
                    onChange={(e) => setPaymentData({ ...paymentData, transferAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </>
            )}

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="flex justify-between font-bold">
                <span>Total a Pagar:</span>
                <span>${account.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handlePayFull}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getStatusText = (status) => {
  const statusMap = {
    open: 'Abierta',
    closed_pending: 'Cerrada (Pendiente Pago)',
    split_pending: 'División Pendiente',
    paid: 'Pagada',
    cancelled: 'Cancelada'
  };
  return statusMap[status] || status;
};

const getItemStatusText = (status) => {
  const statusMap = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Lista',
    served: 'Servida',
    cancelled: 'Cancelada'
  };
  return statusMap[status] || status;
};

export default AccountPage;
