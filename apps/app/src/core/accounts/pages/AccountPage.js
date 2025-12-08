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
  cancelAccount,
  sendToKitchen,
  addSubcuenta,
  removeSubcuenta,
  assignItemToSubcuenta,
  getSubcuentasSummary,
  paySubcuenta,
  cancelItem,
  editItem
} from '../services/accountsService';
import { productService } from '../../products/services/productService';
import PrintComanda from '../../../shared/components/PrintComanda';

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
  const [showComandaModal, setShowComandaModal] = useState(false);
  const [comandaData, setComandaData] = useState(null);
  const [showPaymentOptionsModal, setShowPaymentOptionsModal] = useState(false);
  const [showSubcuentasModal, setShowSubcuentasModal] = useState(false);
  const [showSubcuentaPaymentModal, setShowSubcuentaPaymentModal] = useState(false);
  const [showTicketOptionsModal, setShowTicketOptionsModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);

  // Subcuentas
  const [newSubcuentaName, setNewSubcuentaName] = useState('');
  const [selectedSubcuentaForPayment, setSelectedSubcuentaForPayment] = useState(null);
  const [subcuentasSummary, setSubcuentasSummary] = useState(null);
  const [selectedSubcuentaForProduct, setSelectedSubcuentaForProduct] = useState('');

  // Edit/Cancel item states
  const [selectedItem, setSelectedItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    quantity: 1,
    note: '',
    subcuentaName: ''
  });
  const [cancelReason, setCancelReason] = useState('');

  // Form states
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [tipData, setTipData] = useState({ type: 'percentage', amount: 0 });
  const [splits, setSplits] = useState([]);
  const [numberOfSplits, setNumberOfSplits] = useState(2);
  const [selectedSplitForPayment, setSelectedSplitForPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'cash',
    cashReceived: 0,
    cardAmount: 0,
    transferAmount: 0
  });
  const [preliminaryTicketData, setPreliminaryTicketData] = useState(null);

  const tiendaId = localStorage.getItem('tiendaId');

  // Calcular monto restante (excluyendo subcuentas ya pagadas)
  const calculateRemainingAmount = () => {
    if (!account) return 0;

    // Si no hay subcuentas, retornar el total (subtotal - discount)
    if (!account.subcuentas || account.subcuentas.length === 0) {
      return account.subtotal - (account.discount || 0);
    }

    const paidSubcuentas = account.subcuentas.filter(s => s.isPaid);

    // Si no hay subcuentas pagadas, retornar el total
    if (paidSubcuentas.length === 0) {
      return account.subtotal - (account.discount || 0);
    }

    // Calcular solo los items de subcuentas no pagadas + items sin asignar
    let remaining = 0;
    const unpaidSubcuentaNames = account.subcuentas
      .filter(s => !s.isPaid)
      .map(s => s.name);

    account.orders?.forEach(order => {
      order.items?.forEach(item => {
        if (item.status !== 'cancelled') {
          const isInUnpaidSubcuenta = unpaidSubcuentaNames.includes(item.subcuentaName);
          const isUnassigned = !item.subcuentaName;

          if (isInUnpaidSubcuenta || isUnassigned) {
            remaining += item.price * item.quantity;
          }
        }
      });
    });

    // Restar el descuento aplicado
    return remaining - (account.discount || 0);
  };

  const remainingAmount = account ? calculateRemainingAmount() : 0;
  const hasPaidSubcuentas = account?.subcuentas?.some(s => s.isPaid) || false;

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
    const existing = selectedProducts.find((p) => p.productId === product._id && p.subcuentaName === selectedSubcuentaForProduct);
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          (p.productId === product._id && p.subcuentaName === selectedSubcuentaForProduct)
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
          subcuentaName: selectedSubcuentaForProduct || null
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
      // Calcular subtotal base (solo items no pagados si hay subcuentas pagadas)
      const baseSubtotal = hasPaidSubcuentas ? remainingAmount : account.subtotal;

      let finalDiscount = parseFloat(discountAmount);

      // Si es porcentaje, calcular el monto basado en el subtotal correspondiente
      if (discountType === 'percentage') {
        finalDiscount = (baseSubtotal * parseFloat(discountAmount)) / 100;
      }

      await applyDiscount(accountId, finalDiscount);
      setSuccess(hasPaidSubcuentas
        ? 'Descuento aplicado al monto restante'
        : 'Descuento aplicado');
      setShowDiscountModal(false);
      setDiscountAmount(0);
      setDiscountType('percentage');
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

  const handleGeneratePreliminary = async (subcuentaName = null) => {
    try {
      const data = await generatePreliminaryTicket(accountId);
      let ticketData = data.data.ticket;

      // Si hay subcuenta seleccionada, filtrar items
      if (subcuentaName) {
        const filteredItems = ticketData.items.filter(item => item.subcuentaName === subcuentaName);
        const subtotal = filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        ticketData = {
          ...ticketData,
          items: filteredItems,
          subtotal,
          total: subtotal - (ticketData.discount || 0),
          subcuentaName
        };
      }

      setPreliminaryTicketData(ticketData);
      setShowPreliminaryTicket(true);
      setShowTicketOptionsModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al generar ticket');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleTicketButtonClick = () => {
    if (account.subcuentas && account.subcuentas.length > 0) {
      setShowTicketOptionsModal(true);
    } else {
      handleGeneratePreliminary();
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
        paymentMethod: paymentData.paymentMethod,
        paymentType: paymentData.paymentMethod === 'mixed' ? 'mixed' : 'single'
      };

      // Agregar propina si hay
      if (paymentData.tipAmount && paymentData.tipAmount > 0) {
        payment.tip = {
          amount: paymentData.tipAmount,
          percentage: paymentData.tipPercentage || 0,
          type: paymentData.tipType || 'fixed'
        };
      }

      if (paymentData.paymentMethod === 'cash') {
        payment.cashReceived = parseFloat(paymentData.cashReceived);
      } else if (paymentData.paymentMethod === 'mixed') {
        const cashAmt = parseFloat(paymentData.cashReceived) || 0;
        const cardAmt = parseFloat(paymentData.cardAmount) || 0;
        const transferAmt = parseFloat(paymentData.transferAmount) || 0;
        const totalMixed = cashAmt + cardAmt + transferAmt;
        const tipAmount = paymentData.tipAmount || 0;

        // Cascada inteligente: Asignar propina en orden de prioridad
        // 1. Efectivo (lo que alcance)
        // 2. Transferencia (si sobra propina)
        // 3. Tarjeta (si aún sobra propina)
        let remainingTip = tipAmount;

        payment.mixedPayments = [];

        if (cashAmt > 0) {
          const tipFromCash = Math.min(cashAmt, remainingTip);
          const cashForSale = cashAmt - tipFromCash;
          remainingTip -= tipFromCash;

          payment.mixedPayments.push({
            method: 'efectivo',
            amount: cashForSale,
            receivedAmount: cashAmt
          });
        }

        if (transferAmt > 0) {
          const tipFromTransfer = Math.min(transferAmt, remainingTip);
          const transferForSale = transferAmt - tipFromTransfer;
          remainingTip -= tipFromTransfer;

          payment.mixedPayments.push({
            method: 'transferencia',
            amount: transferForSale
          });
        }

        if (cardAmt > 0) {
          const tipFromCard = Math.min(cardAmt, remainingTip);
          const cardForSale = cardAmt - tipFromCard;
          remainingTip -= tipFromCard;

          payment.mixedPayments.push({
            method: 'tarjeta',
            amount: cardForSale
          });
        }
      }

      const result = await payAccount(accountId, payment);
      const message = result.data?.paidSubcuentas > 0
        ? `Restante pagado: $${result.data.totalPaid?.toFixed(2)}`
        : 'Cuenta pagada exitosamente';
      setSuccess(message);
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

  // Verificar si hay items pendientes de enviar a cocina
  const hasPendingItems = () => {
    if (!account || !account.orders) return false;
    return account.orders.some(order =>
      order.items.some(item => item.status === 'pending')
    );
  };

  // Enviar items pendientes a cocina
  const handleSendToKitchen = async () => {
    try {
      const response = await sendToKitchen(accountId);
      setComandaData(response.data.comandaData);
      setShowComandaModal(true);
      loadAccount(); // Recargar cuenta para actualizar estados
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar a cocina');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handlers de editar/cancelar items
  const handleOpenEditModal = (item) => {
    setSelectedItem(item);
    setEditFormData({
      quantity: item.quantity,
      note: item.note || '',
      subcuentaName: item.subcuentaName || ''
    });
    setShowEditItemModal(true);
  };

  const handleSubmitEditItem = async () => {
    if (!selectedItem) return;

    try {
      await editItem(accountId, selectedItem.orderIdx, selectedItem.itemIdx, editFormData);
      setShowEditItemModal(false);
      setSelectedItem(null);
      loadAccount();
      setSuccess('Item editado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al editar item');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleOpenCancelModal = (item) => {
    setSelectedItem(item);
    setCancelReason('');
    setShowCancelItemModal(true);
  };

  const handleSubmitCancelItem = async () => {
    if (!selectedItem) return;

    try {
      await cancelItem(accountId, selectedItem.orderIdx, selectedItem.itemIdx, cancelReason);
      setShowCancelItemModal(false);
      setSelectedItem(null);
      setCancelReason('');
      loadAccount();
      setSuccess('Item cancelado exitosamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar item');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Handlers de subcuentas
  const handleAddSubcuentaName = async () => {
    const name = newSubcuentaName.trim();
    if (!name) return;

    try {
      await addSubcuenta(accountId, name);
      setNewSubcuentaName('');
      loadAccount();
      setSuccess('Subcuenta agregada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar subcuenta');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRemoveSubcuentaName = async (name) => {
    if (!window.confirm(`¿Eliminar subcuenta "${name}"?`)) return;

    try {
      await removeSubcuenta(accountId, name);
      loadAccount();
      setSuccess('Subcuenta eliminada');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar subcuenta');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handlePaySubcuenta = async () => {
    if (!selectedSubcuentaForPayment) return;

    try {
      // Calcular descuento proporcional
      const proportionalDiscount = account.discount && account.subtotal > 0
        ? (selectedSubcuentaForPayment.subtotal / account.subtotal) * account.discount
        : 0;

      const payment = {
        subcuentaName: selectedSubcuentaForPayment.isUnassigned ? null : selectedSubcuentaForPayment.name,
        paymentMethod: paymentData.paymentMethod,
        paymentType: paymentData.paymentMethod === 'mixed' ? 'mixed' : 'single',
        tipAmount: paymentData.tipAmount || 0,
        tipPercentage: paymentData.tipPercentage || 0,
        tipType: paymentData.tipType || 'none',
        discount: proportionalDiscount,
        payUnassigned: selectedSubcuentaForPayment.isUnassigned || false
      };

      // Si es pago mixto, aplicar cascada inteligente
      if (paymentData.paymentMethod === 'mixed') {
        const cashAmt = parseFloat(paymentData.cashReceived) || 0;
        const cardAmt = parseFloat(paymentData.cardAmount) || 0;
        const transferAmt = parseFloat(paymentData.transferAmount) || 0;
        const tipAmount = paymentData.tipAmount || 0;

        let remainingTip = tipAmount;
        payment.mixedPayments = [];

        if (cashAmt > 0) {
          const tipFromCash = Math.min(cashAmt, remainingTip);
          const cashForSale = cashAmt - tipFromCash;
          remainingTip -= tipFromCash;

          payment.mixedPayments.push({
            method: 'efectivo',
            amount: cashForSale,
            receivedAmount: cashAmt
          });
        }

        if (transferAmt > 0) {
          const tipFromTransfer = Math.min(transferAmt, remainingTip);
          const transferForSale = transferAmt - tipFromTransfer;
          remainingTip -= tipFromTransfer;

          payment.mixedPayments.push({
            method: 'transferencia',
            amount: transferForSale
          });
        }

        if (cardAmt > 0) {
          const tipFromCard = Math.min(cardAmt, remainingTip);
          const cardForSale = cardAmt - tipFromCard;
          remainingTip -= tipFromCard;

          payment.mixedPayments.push({
            method: 'tarjeta',
            amount: cardForSale
          });
        }
      }

      await paySubcuenta(accountId, payment);
      setSuccess(`${selectedSubcuentaForPayment.isUnassigned ? 'Items sin asignar' : `Subcuenta "${selectedSubcuentaForPayment.name}"`} pagados`);
      setSelectedSubcuentaForPayment(null);

      // Recargar resumen
      const summary = await getSubcuentasSummary(accountId);
      setSubcuentasSummary(summary.data);
      loadAccount();

      // Si todas pagadas, cerrar modal y redirigir
      // Subcuentas vacías se consideran como pagadas
      const allPaid = summary.data.subcuentas.every(s => s.isPaid || s.subtotal === 0);
      if (allPaid && summary.data.unassigned.subtotal === 0) {
        setTimeout(() => {
          setShowSubcuentaPaymentModal(false);
          navigate('/restaurant/waiter');
        }, 2000);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al pagar subcuenta');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Configurar división en partes iguales
  const handleConfigureSplit = async () => {
    try {
      const amountPerSplit = (account.total / numberOfSplits);
      const splitConfig = [];

      for (let i = 1; i <= numberOfSplits; i++) {
        splitConfig.push({
          splitNumber: i,
          subtotal: amountPerSplit,
          total: amountPerSplit
        });
      }

      await configureSplit(accountId, splitConfig);
      setSuccess(`Cuenta dividida en ${numberOfSplits} partes iguales`);
      loadAccount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al dividir cuenta');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Pagar una división específica
  const handlePaySplit = async () => {
    if (!selectedSplitForPayment) return;

    try {
      const payment = {
        paymentMethod: paymentData.paymentMethod,
        tipAmount: paymentData.tipAmount || 0,
        tipPercentage: paymentData.tipPercentage || 0,
        tipType: paymentData.tipType || 'none'
      };

      if (paymentData.paymentMethod === 'cash') {
        payment.cashReceived = parseFloat(paymentData.cashReceived);
      }

      await paySplit(accountId, selectedSplitForPayment.splitNumber, payment);
      setSuccess(`Parte ${selectedSplitForPayment.splitNumber} pagada`);
      setSelectedSplitForPayment(null);
      loadAccount();

      // Verificar si todas las partes están pagadas
      const updatedAccount = await getAccountById(accountId);
      if (updatedAccount.data.account.status === 'paid') {
        setTimeout(() => {
          setShowSplitModal(false);
          navigate('/restaurant/waiter');
        }, 2000);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al pagar división');
      setTimeout(() => setError(''), 5000);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
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
            Cuenta #{account.folio} - Mesa{account.tableIds?.length > 1 ? 's' : ''} {
              account.tableIds?.length > 0
                ? account.tableIds.map(t => t.number).join('+')
                : account.tableId?.number || 'N/A'
            }
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
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        Cantidad: {item.quantity} × ${item.price.toFixed(2)}
                      </div>
                      {item.subcuentaName && (
                        <div className="text-xs text-blue-600 font-medium">
                          → {item.subcuentaName}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-xs text-gray-500 italic">Nota: {item.note}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        Orden #{item.orderNumber} - {getItemStatusText(item.status)}
                      </div>

                      {/* Botones de editar/cancelar solo para items pendientes */}
                      {item.status === 'pending' && account.status === 'open' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleOpenCancelModal(item)}
                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                          >
                            ❌ Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-right font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botón Enviar a Preparación */}
            {account.status === 'open' && activeItems.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSendToKitchen}
                  disabled={!hasPendingItems()}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    hasPendingItems()
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {hasPendingItems() ? '🍳 Enviar a Preparación' : '✓ Todo enviado a cocina'}
                </button>
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
                    onClick={() => setShowSubcuentasModal(true)}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Gestionar Subcuentas ({account.subcuentas?.length || 0})
                  </button>
                  <button
                    onClick={() => setShowDiscountModal(true)}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Aplicar Descuento
                  </button>
                  <button
                    onClick={handleTicketButtonClick}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Ticket Preliminar
                  </button>
                  <button
                    onClick={() => setShowPaymentOptionsModal(true)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Solicitar Cuenta
                  </button>
                </>
              )}

              {(account.status === 'closed_pending' || account.status === 'split_pending') && (
                <button
                  onClick={() => setShowPaymentOptionsModal(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Continuar Pago
                </button>
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

              {/* Selector de subcuenta */}
              {account.subcuentas && account.subcuentas.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Asignar a:</label>
                  <select
                    value={selectedSubcuentaForProduct}
                    onChange={(e) => setSelectedSubcuentaForProduct(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sin asignar (cuenta general)</option>
                    {account.subcuentas.map((sub) => (
                      <option key={sub.name} value={sub.name}>
                        {sub.name} {sub.isPaid && '(Pagado)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">${product.price?.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {selectedProducts.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-2">Productos Seleccionados:</h3>
                  <div className="space-y-2 mb-4">
                    {selectedProducts.map((item, idx) => (
                      <div
                        key={`${item.productId}-${item.subcuentaName || 'general'}-${idx}`}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <div>{item.name}</div>
                          {item.subcuentaName && (
                            <div className="text-xs text-blue-600">→ {item.subcuentaName}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const newQty = item.quantity - 1;
                              if (newQty <= 0) {
                                setSelectedProducts(selectedProducts.filter((_, i) => i !== idx));
                              } else {
                                setSelectedProducts(selectedProducts.map((p, i) =>
                                  i === idx ? { ...p, quantity: newQty } : p
                                ));
                              }
                            }}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            -
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => setSelectedProducts(selectedProducts.map((p, i) =>
                              i === idx ? { ...p, quantity: p.quantity + 1 } : p
                            ))}
                            className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
                          >
                            +
                          </button>
                          <button
                            onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx))}
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

            {hasPaidSubcuentas && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-700">
                ⚠️ Hay {account.subcuentas.filter(s => s.isPaid).length} subcuenta(s) pagada(s).
                El descuento se aplicará solo al monto restante (${remainingAmount.toFixed(2)}).
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Tipo de Descuento</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    discountType === 'percentage'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  % Porcentaje
                </button>
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    discountType === 'fixed'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  $ Monto Fijo
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {discountType === 'percentage' ? 'Porcentaje de Descuento' : 'Monto del Descuento'}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : account?.subtotal}
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder={discountType === 'percentage' ? 'Ej: 10' : 'Ej: 50.00'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Vista previa del descuento */}
            {discountAmount > 0 && account && (
              <div className="bg-gray-100 p-3 rounded-lg mb-4 text-sm">
                <div className="flex justify-between">
                  <span>{hasPaidSubcuentas ? 'Restante:' : 'Subtotal:'}</span>
                  <span>${(hasPaidSubcuentas ? remainingAmount : account.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-yellow-600">
                  <span>Descuento:</span>
                  <span>
                    -${discountType === 'percentage'
                      ? (((hasPaidSubcuentas ? remainingAmount : account.subtotal) * parseFloat(discountAmount)) / 100).toFixed(2)
                      : parseFloat(discountAmount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2">
                  <span>Nuevo Total:</span>
                  <span>
                    ${((hasPaidSubcuentas ? remainingAmount : account.subtotal) - (discountType === 'percentage'
                      ? ((hasPaidSubcuentas ? remainingAmount : account.subtotal) * parseFloat(discountAmount)) / 100
                      : parseFloat(discountAmount))).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDiscountModal(false);
                  setDiscountAmount(0);
                  setDiscountType('percentage');
                }}
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
            {/* Header con configuración de tienda */}
            <div className="border-b pb-4 mb-4">
              <div className="text-center">
                {preliminaryTicketData.ticketConfig?.mostrarLogo && preliminaryTicketData.ticketConfig?.logo && (
                  <img
                    src={preliminaryTicketData.ticketConfig.logo}
                    alt="Logo"
                    className="h-16 mx-auto mb-2"
                  />
                )}
                <div className="text-xl font-bold">
                  {preliminaryTicketData.ticketConfig?.nombreNegocio || preliminaryTicketData.tienda?.nombre}
                </div>
                {preliminaryTicketData.tienda?.direccion && (
                  <div className="text-xs text-gray-600">{preliminaryTicketData.tienda.direccion}</div>
                )}
                {preliminaryTicketData.tienda?.telefono && (
                  <div className="text-xs text-gray-600">Tel: {preliminaryTicketData.tienda.telefono}</div>
                )}
                {preliminaryTicketData.ticketConfig?.mostrarRFC && preliminaryTicketData.ticketConfig?.rfc && (
                  <div className="text-xs text-gray-600">RFC: {preliminaryTicketData.ticketConfig.rfc}</div>
                )}
                {preliminaryTicketData.ticketConfig?.mensajeSuperior && (
                  <div className="text-xs text-gray-500 mt-1">{preliminaryTicketData.ticketConfig.mensajeSuperior}</div>
                )}
              </div>
            </div>

            <div className="text-center mb-3">
              <div className="text-lg font-bold text-orange-600">*** TICKET DE VENTA ***</div>
              <div className="text-sm text-gray-500">(Preliminar - Pendiente de pago)</div>
            </div>

            <div className="border-t border-b py-3 mb-4 space-y-1">
              <div className="text-center text-sm">
                <div className="font-bold">Folio: {preliminaryTicketData.folio}</div>
                {preliminaryTicketData.subcuentaName && (
                  <div className="font-medium text-indigo-600">
                    Subcuenta: {preliminaryTicketData.subcuentaName}
                  </div>
                )}
                <div>Mesa: {preliminaryTicketData.mesa}</div>
                <div>Mesero: {preliminaryTicketData.mesero}</div>
                <div>{new Date(preliminaryTicketData.fecha).toLocaleString()}</div>
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

            {preliminaryTicketData.ticketConfig?.mensajeInferior && (
              <div className="text-center text-xs text-gray-500 mt-4 whitespace-pre-line">
                {preliminaryTicketData.ticketConfig.mensajeInferior}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  const config = preliminaryTicketData.ticketConfig || {};
                  const anchoTicket = config.anchoTicket === '58mm' ? '200px' : '280px';
                  const fontSize = config.tamanoFuente === 'small' ? '10px' : config.tamanoFuente === 'large' ? '14px' : '12px';

                  const printWindow = window.open('', '_blank');
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Ticket Preliminar - Mesa ${preliminaryTicketData.mesa}</title>
                        <style>
                          body { font-family: monospace; padding: 10px; max-width: ${anchoTicket}; margin: 0 auto; font-size: ${fontSize}; }
                          .center { text-align: center; }
                          .border-t { border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
                          .border-b { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
                          .flex { display: flex; justify-content: space-between; }
                          .bold { font-weight: bold; }
                          .text-lg { font-size: 1.3em; }
                          .text-sm { font-size: 0.9em; }
                          .mb-2 { margin-bottom: 8px; }
                          .text-red { color: #dc2626; }
                          .text-green { color: #16a34a; }
                          .text-orange { color: #ea580c; }
                          .logo { max-height: 60px; margin-bottom: 8px; }
                          .whitespace-pre { white-space: pre-line; }
                        </style>
                      </head>
                      <body>
                        <div class="center border-b">
                          ${config.mostrarLogo && config.logo ? `<img src="${config.logo}" class="logo" alt="Logo"/>` : ''}
                          <div class="bold text-lg">${config.nombreNegocio || preliminaryTicketData.tienda?.nombre || ''}</div>
                          ${preliminaryTicketData.tienda?.direccion ? `<div class="text-sm">${preliminaryTicketData.tienda.direccion}</div>` : ''}
                          ${preliminaryTicketData.tienda?.telefono ? `<div class="text-sm">Tel: ${preliminaryTicketData.tienda.telefono}</div>` : ''}
                          ${config.mostrarRFC && config.rfc ? `<div class="text-sm">RFC: ${config.rfc}</div>` : ''}
                          ${config.mensajeSuperior ? `<div class="text-sm">${config.mensajeSuperior}</div>` : ''}
                        </div>
                        <div class="center mb-2">
                          <div class="bold text-orange">*** TICKET DE VENTA ***</div>
                          <div class="text-sm">(Preliminar - Pendiente de pago)</div>
                        </div>
                        <div class="center border-b">
                          <div class="bold">Folio: ${preliminaryTicketData.folio}</div>
                          ${preliminaryTicketData.subcuentaName ? `<div class="bold">Subcuenta: ${preliminaryTicketData.subcuentaName}</div>` : ''}
                          <div>Mesa: ${preliminaryTicketData.mesa}</div>
                          <div>Mesero: ${preliminaryTicketData.mesero}</div>
                          <div>${new Date(preliminaryTicketData.fecha).toLocaleString()}</div>
                        </div>
                        <div class="mb-2">
                          ${preliminaryTicketData.items.map(item => `
                            <div class="flex">
                              <span>${item.quantity} × ${item.name}</span>
                              <span>$${(item.quantity * item.price).toFixed(2)}</span>
                            </div>
                          `).join('')}
                        </div>
                        <div class="border-t">
                          <div class="flex"><span>Subtotal:</span><span>$${preliminaryTicketData.subtotal.toFixed(2)}</span></div>
                          ${preliminaryTicketData.discount > 0 ? `<div class="flex text-red"><span>Descuento:</span><span>-$${preliminaryTicketData.discount.toFixed(2)}</span></div>` : ''}
                          ${preliminaryTicketData.propina > 0 ? `<div class="flex text-green"><span>Propina:</span><span>$${preliminaryTicketData.propina.toFixed(2)}</span></div>` : ''}
                          <div class="flex bold text-lg border-t"><span>Total:</span><span>$${preliminaryTicketData.total.toFixed(2)}</span></div>
                        </div>
                        ${config.mensajeInferior ? `<div class="center text-sm whitespace-pre mt-2">${config.mensajeInferior}</div>` : ''}
                        ${config.leyendaFiscal ? `<div class="center text-sm mt-2">${config.leyendaFiscal}</div>` : ''}
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.print();
                }}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Imprimir
              </button>
              <button
                onClick={() => setShowPreliminaryTicket(false)}
                className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Procesar Pago</h2>

            {/* Propina */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Propina</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setPaymentData({
                    ...paymentData,
                    tipType: 'percentage',
                    tipPercentage: 10,
                    tipAmount: remainingAmount * 0.10
                  })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    paymentData.tipPercentage === 10
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  10%
                </button>
                <button
                  onClick={() => setPaymentData({
                    ...paymentData,
                    tipType: 'percentage',
                    tipPercentage: 15,
                    tipAmount: remainingAmount * 0.15
                  })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    paymentData.tipPercentage === 15
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  15%
                </button>
                <button
                  onClick={() => setPaymentData({
                    ...paymentData,
                    tipType: 'percentage',
                    tipPercentage: 20,
                    tipAmount: remainingAmount * 0.20
                  })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    paymentData.tipPercentage === 20
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  20%
                </button>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Propina manual"
                value={paymentData.tipType === 'fixed' ? paymentData.tipAmount : ''}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  tipType: 'fixed',
                  tipPercentage: 0,
                  tipAmount: parseFloat(e.target.value) || 0
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

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
                {(() => {
                  const totalToPay = remainingAmount + (paymentData.tipAmount || 0);
                  const cashReceived = parseFloat(paymentData.cashReceived) || 0;
                  const isInsufficient = cashReceived > 0 && cashReceived < totalToPay;

                  return (
                    <>
                      {cashReceived > 0 && (
                        <div className={`mt-2 text-sm ${isInsufficient ? 'text-red-600' : 'text-gray-600'}`}>
                          {isInsufficient ? 'Faltante' : 'Cambio'}: ${Math.abs(cashReceived - totalToPay).toFixed(2)}
                        </div>
                      )}
                      {isInsufficient && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          ⚠️ El efectivo recibido es insuficiente
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {paymentData.paymentMethod === 'mixed' && (
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800 font-medium mb-1">
                    💡 Total con propina: ${(remainingAmount + (paymentData.tipAmount || 0)).toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-600">
                    Puedes incluir la propina en los métodos de pago. El sistema la separará automáticamente.
                  </div>
                </div>

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

                {(() => {
                  const cashAmt = parseFloat(paymentData.cashReceived) || 0;
                  const cardAmt = parseFloat(paymentData.cardAmount) || 0;
                  const transferAmt = parseFloat(paymentData.transferAmount) || 0;
                  const totalMixed = cashAmt + cardAmt + transferAmt;
                  const totalWithTip = remainingAmount + (paymentData.tipAmount || 0);
                  const difference = totalMixed - totalWithTip;
                  const isValid = Math.abs(difference) <= 0.01;

                  return (
                    <div className={`mb-4 p-3 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Total ingresado:</span>
                        <span className={isValid ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                          ${totalMixed.toFixed(2)}
                        </span>
                      </div>
                      {!isValid && (
                        <div className="mt-2 text-xs text-yellow-700">
                          {difference > 0
                            ? `⚠️ Excede por $${difference.toFixed(2)}`
                            : `⚠️ Falta $${Math.abs(difference).toFixed(2)}`
                          }
                        </div>
                      )}
                      {isValid && (
                        <div className="mt-2 text-xs text-green-700">
                          ✓ Total correcto (Venta: ${remainingAmount.toFixed(2)} + Propina: ${(paymentData.tipAmount || 0).toFixed(2)})
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              {hasPaidSubcuentas && (
                <div className="text-sm text-amber-600 mb-2 pb-2 border-b border-gray-300">
                  ⚠️ {account.subcuentas.filter(s => s.isPaid).length} subcuenta(s) ya pagada(s).
                  Se cobrará solo el restante.
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${remainingAmount.toFixed(2)}</span>
              </div>
              {(paymentData.tipAmount || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Propina:</span>
                  <span>${(paymentData.tipAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                <span>Total a Pagar:</span>
                <span>${(remainingAmount + (paymentData.tipAmount || 0)).toFixed(2)}</span>
              </div>
              {hasPaidSubcuentas && (
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Total original:</span>
                  <span>${account.total.toFixed(2)}</span>
                </div>
              )}
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
                disabled={(() => {
                  if (paymentData.paymentMethod === 'cash') {
                    const totalToPay = remainingAmount + (paymentData.tipAmount || 0);
                    const cashReceived = parseFloat(paymentData.cashReceived) || 0;
                    return cashReceived < totalToPay;
                  } else if (paymentData.paymentMethod === 'mixed') {
                    const cashAmt = parseFloat(paymentData.cashReceived) || 0;
                    const cardAmt = parseFloat(paymentData.cardAmount) || 0;
                    const transferAmt = parseFloat(paymentData.transferAmount) || 0;
                    const totalMixed = cashAmt + cardAmt + transferAmt;
                    const totalWithTip = remainingAmount + (paymentData.tipAmount || 0);
                    const difference = Math.abs(totalMixed - totalWithTip);
                    return difference > 0.01;
                  }
                  return false;
                })()}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comanda - Enviar a Cocina */}
      {showComandaModal && comandaData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🍳</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                ¡Enviado a Cocina!
              </h3>
              <p className="text-gray-600">
                {comandaData.items?.length || 0} producto(s) enviado(s) a preparación
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Mesa:</strong> {comandaData.mesa}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <strong>Mesero:</strong> {comandaData.mesero}
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="text-sm font-medium mb-2">Productos:</div>
                {comandaData.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.quantity}x {item.name}</span>
                    {item.note && <span className="text-xs text-gray-500 italic">({item.note})</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowComandaModal(false);
                  setComandaData(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  // Imprimir comanda
                  if (comandaData) {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Comanda - Mesa ${comandaData.mesa}</title>
                          <style>
                            body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; }
                            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                            .item { display: flex; justify-content: space-between; margin: 5px 0; }
                            .note { font-size: 0.8em; font-style: italic; color: #666; }
                            .footer { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; text-align: center; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h2>COMANDA</h2>
                            <p>Mesa: ${comandaData.mesa}</p>
                            <p>Mesero: ${comandaData.mesero}</p>
                            <p>${new Date(comandaData.fecha).toLocaleString()}</p>
                          </div>
                          ${comandaData.items?.map(item => `
                            <div class="item">
                              <span>${item.quantity}x ${item.name}</span>
                            </div>
                            ${item.note ? `<div class="note">→ ${item.note}</div>` : ''}
                          `).join('')}
                          <div class="footer">
                            <p>Folio: ${comandaData.folio}</p>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
              >
                🖨️ Imprimir Comanda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Opciones de Pago */}
      {showPaymentOptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Opciones de Pago</h2>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowPaymentOptionsModal(false);
                  setShowPaymentModal(true);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Pagar Cuenta Completa
              </button>

              {account.subcuentas && account.subcuentas.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      const summary = await getSubcuentasSummary(accountId);
                      setSubcuentasSummary(summary.data);
                      setShowPaymentOptionsModal(false);
                      setShowSubcuentaPaymentModal(true);
                    } catch (err) {
                      setError('Error al cargar subcuentas');
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Pagar por Subcuenta ({account.subcuentas.filter(s => !s.isPaid).length} pendientes)
                </button>
              )}

              <button
                onClick={() => {
                  setShowPaymentOptionsModal(false);
                  setShowSplitModal(true);
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Dividir Cuenta (Partes Iguales)
              </button>
            </div>

            <button
              onClick={() => setShowPaymentOptionsModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Dividir en Partes Iguales */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Dividir en Partes Iguales</h2>

            {/* Si no está dividida aún */}
            {!account.isSplit ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">¿En cuántas partes?</label>
                  <div className="flex gap-2 mb-3">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNumberOfSplits(num)}
                        className={`flex-1 py-3 rounded-lg font-bold text-lg ${
                          numberOfSplits === num
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={numberOfSplits}
                    onChange={(e) => setNumberOfSplits(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Número personalizado"
                  />
                </div>

                <div className="bg-purple-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Total de la cuenta:</span>
                    <span className="font-medium">${account.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Dividido entre:</span>
                    <span className="font-medium">{numberOfSplits} personas</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Cada quien paga:</span>
                    <span className="text-purple-600">${(account.total / numberOfSplits).toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleConfigureSplit}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium mb-3"
                >
                  Confirmar División
                </button>
              </>
            ) : (
              /* Si ya está dividida, mostrar las partes para pagar */
              <>
                <div className="space-y-3 mb-4">
                  {account.splitConfig.map((split) => (
                    <div
                      key={split.splitNumber}
                      className={`p-4 rounded-lg border ${
                        split.paymentStatus === 'paid'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-purple-500 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (split.paymentStatus !== 'paid') {
                          setSelectedSplitForPayment(split);
                          setPaymentData({
                            ...paymentData,
                            tipType: 'none',
                            tipAmount: 0,
                            tipPercentage: 0
                          });
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">Parte {split.splitNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${split.total.toFixed(2)}</div>
                          {split.paymentStatus === 'paid' && (
                            <span className="text-xs text-green-600">✓ Pagado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Formulario de pago para la parte seleccionada */}
                {selectedSplitForPayment && (
                  <div className="border-t pt-4">
                    <h3 className="font-bold mb-3">Pagar Parte {selectedSplitForPayment.splitNumber}</h3>

                    {/* Propina */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Propina</label>
                      <div className="flex gap-2 mb-2">
                        {[10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setPaymentData({
                              ...paymentData,
                              tipType: 'percentage',
                              tipPercentage: pct,
                              tipAmount: selectedSplitForPayment.total * (pct / 100)
                            })}
                            className={`flex-1 py-2 rounded-lg font-medium ${
                              paymentData.tipPercentage === pct
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Propina manual"
                        value={paymentData.tipType === 'fixed' ? paymentData.tipAmount : ''}
                        onChange={(e) => setPaymentData({
                          ...paymentData,
                          tipType: 'fixed',
                          tipPercentage: 0,
                          tipAmount: parseFloat(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Método de Pago */}
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
                      </div>
                    )}

                    {/* Resumen */}
                    {(() => {
                      const totalSplit = selectedSplitForPayment.total + (paymentData.tipAmount || 0);
                      const cashReceived = parseFloat(paymentData.cashReceived) || 0;
                      const isInsufficientCash = paymentData.paymentMethod === 'cash' && cashReceived > 0 && cashReceived < totalSplit;

                      return (
                        <>
                          <div className="bg-gray-100 p-3 rounded-lg mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>${selectedSplitForPayment.total.toFixed(2)}</span>
                            </div>
                            {(paymentData.tipAmount || 0) > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Propina:</span>
                                <span>${(paymentData.tipAmount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold border-t pt-2 mt-2">
                              <span>Total:</span>
                              <span>${totalSplit.toFixed(2)}</span>
                            </div>
                            {paymentData.paymentMethod === 'cash' && cashReceived > 0 && (
                              <div className={`flex justify-between text-sm mt-1 ${isInsufficientCash ? 'text-red-600' : 'text-blue-600'}`}>
                                <span>{isInsufficientCash ? 'Faltante:' : 'Cambio:'}</span>
                                <span>${Math.abs(cashReceived - totalSplit).toFixed(2)}</span>
                              </div>
                            )}
                            {isInsufficientCash && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                ⚠️ El efectivo recibido es insuficiente
                              </div>
                            )}
                          </div>

                          <button
                            onClick={handlePaySplit}
                            disabled={isInsufficientCash}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Pagar ${totalSplit.toFixed(2)}
                          </button>
                        </>
                      );
                    })()}

                  </div>
                )}
              </>
            )}

            <button
              onClick={() => {
                setShowSplitModal(false);
                setSelectedSplitForPayment(null);
                setNumberOfSplits(2);
              }}
              className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Gestionar Subcuentas */}
      {showSubcuentasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Gestionar Subcuentas</h2>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSubcuentaName}
                onChange={(e) => setNewSubcuentaName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubcuentaName()}
                placeholder="Nombre del comensal"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleAddSubcuentaName}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                +
              </button>
            </div>

            {account.subcuentas && account.subcuentas.length > 0 ? (
              <div className="space-y-2 mb-4">
                {account.subcuentas.map((sub) => {
                  // Calcular si la subcuenta está vacía
                  const subcuentaSubtotal = account.orders?.reduce((sum, order) => {
                    return sum + order.items.reduce((itemSum, item) => {
                      if (item.status !== 'cancelled' && item.subcuentaName === sub.name) {
                        return itemSum + (item.price * item.quantity);
                      }
                      return itemSum;
                    }, 0);
                  }, 0) || 0;

                  const isEmpty = subcuentaSubtotal === 0;

                  return (
                    <div
                      key={sub.name}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        sub.isPaid ? 'bg-green-50' : isEmpty ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{sub.name}</span>
                        {sub.isPaid && (
                          <span className="ml-2 text-xs text-green-600">✓ Pagado</span>
                        )}
                        {isEmpty && !sub.isPaid && (
                          <span className="ml-2 text-xs text-orange-600">⚠️ Sin productos</span>
                        )}
                      </div>
                      {!sub.isPaid && (
                        <button
                          onClick={() => handleRemoveSubcuentaName(sub.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4">
                No hay subcuentas. Agrega nombres para dividir la cuenta por persona.
              </p>
            )}

            <button
              onClick={() => setShowSubcuentasModal(false)}
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Opciones de Ticket */}
      {showTicketOptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Ticket Preliminar</h2>

            <div className="space-y-3">
              <button
                onClick={() => handleGeneratePreliminary(null)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Cuenta Completa
              </button>

              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-2">Por Subcuenta:</p>
                {account.subcuentas.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => handleGeneratePreliminary(sub.name)}
                    className={`w-full mb-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      sub.isPaid
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
                    }`}
                  >
                    {sub.name} {sub.isPaid && '(Pagado)'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowTicketOptionsModal(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Pagar Subcuenta */}
      {showSubcuentaPaymentModal && subcuentasSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Pagar por Subcuenta</h2>

            <div className="space-y-3 mb-4">
              {subcuentasSummary.subcuentas
                .filter(sub => sub.subtotal > 0 || sub.isPaid) // Solo mostrar subcuentas con productos o ya pagadas
                .map((sub) => (
                <div
                  key={sub.name}
                  className={`p-4 rounded-lg border ${
                    sub.isPaid
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-blue-500 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!sub.isPaid) {
                      setSelectedSubcuentaForPayment(sub);
                      setPaymentData({
                        ...paymentData,
                        tipType: 'none',
                        tipAmount: 0,
                        tipPercentage: 0
                      });
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-sm text-gray-500">{sub.items.length} productos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${sub.subtotal.toFixed(2)}</div>
                      {sub.isPaid && (
                        <span className="text-xs text-green-600">✓ Pagado</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Items sin asignar - pendientes */}
              {subcuentasSummary.unassigned && subcuentasSummary.unassigned.subtotal > 0 && (
                <div
                  className="p-4 rounded-lg border bg-yellow-50 border-yellow-300 hover:border-blue-500 cursor-pointer"
                  onClick={() => {
                    setSelectedSubcuentaForPayment({
                      name: '(Sin Asignar)',
                      subtotal: subcuentasSummary.unassigned.subtotal,
                      items: subcuentasSummary.unassigned.items || [],
                      isPaid: false,
                      isUnassigned: true
                    });
                    setPaymentData({
                      ...paymentData,
                      tipType: 'none',
                      tipAmount: 0,
                      tipPercentage: 0
                    });
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        ⚠️ Items Sin Asignar
                      </div>
                      <div className="text-sm text-gray-600">
                        {subcuentasSummary.unassigned.items?.length || 0} producto(s) sin asignar a ninguna subcuenta
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${subcuentasSummary.unassigned.subtotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items sin asignar - pagados */}
              {subcuentasSummary.unassigned && subcuentasSummary.unassigned.isPaid && (
                <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Items Sin Asignar</div>
                      <div className="text-sm text-gray-500">
                        {subcuentasSummary.unassigned.paidItemsCount} producto(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${subcuentasSummary.unassigned.paidTotal.toFixed(2)}</div>
                      <span className="text-xs text-green-600">✓ Pagado</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedSubcuentaForPayment && (
              <div className="border-t pt-4">
                <h3 className="font-bold mb-3">Pagar: {selectedSubcuentaForPayment.name}</h3>

                {/* Propina */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Propina</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setPaymentData({
                        ...paymentData,
                        tipType: 'percentage',
                        tipPercentage: 10,
                        tipAmount: selectedSubcuentaForPayment.subtotal * 0.10
                      })}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        paymentData.tipPercentage === 10
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      10%
                    </button>
                    <button
                      onClick={() => setPaymentData({
                        ...paymentData,
                        tipType: 'percentage',
                        tipPercentage: 15,
                        tipAmount: selectedSubcuentaForPayment.subtotal * 0.15
                      })}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        paymentData.tipPercentage === 15
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      15%
                    </button>
                    <button
                      onClick={() => setPaymentData({
                        ...paymentData,
                        tipType: 'percentage',
                        tipPercentage: 20,
                        tipAmount: selectedSubcuentaForPayment.subtotal * 0.20
                      })}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        paymentData.tipPercentage === 20
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      20%
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Propina manual"
                    value={paymentData.tipType === 'fixed' ? paymentData.tipAmount : ''}
                    onChange={(e) => setPaymentData({
                      ...paymentData,
                      tipType: 'fixed',
                      tipPercentage: 0,
                      tipAmount: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Método de Pago */}
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
                  </div>
                )}

                {paymentData.paymentMethod === 'mixed' && (() => {
                  const proportionalDiscount = account.discount && account.subtotal > 0
                    ? (selectedSubcuentaForPayment.subtotal / account.subtotal) * account.discount
                    : 0;
                  const subtotalConDescuento = selectedSubcuentaForPayment.subtotal - proportionalDiscount;

                  return (
                    <>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-800 font-medium mb-1">
                          💡 Total con propina: ${(subtotalConDescuento + (paymentData.tipAmount || 0)).toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-600">
                          Puedes incluir la propina en los métodos de pago. El sistema la separará automáticamente.
                        </div>
                      </div>

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

                      {(() => {
                        const cashAmt = parseFloat(paymentData.cashReceived) || 0;
                        const cardAmt = parseFloat(paymentData.cardAmount) || 0;
                        const transferAmt = parseFloat(paymentData.transferAmount) || 0;
                        const totalMixed = cashAmt + cardAmt + transferAmt;
                        const totalWithTip = subtotalConDescuento + (paymentData.tipAmount || 0);
                        const difference = totalMixed - totalWithTip;
                        const isValid = Math.abs(difference) <= 0.01;

                        return (
                          <div className={`mb-4 p-3 rounded-lg ${isValid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">Total ingresado:</span>
                              <span className={isValid ? 'text-green-700 font-bold' : 'text-yellow-700 font-bold'}>
                                ${totalMixed.toFixed(2)}
                              </span>
                            </div>
                            {!isValid && (
                              <div className="mt-2 text-xs text-yellow-700">
                                {difference > 0
                                  ? `⚠️ Excede por $${difference.toFixed(2)}`
                                  : `⚠️ Falta $${Math.abs(difference).toFixed(2)}`
                                }
                              </div>
                            )}
                            {isValid && (
                              <div className="mt-2 text-xs text-green-700">
                                ✓ Total correcto (Venta: ${subtotalConDescuento.toFixed(2)} + Propina: ${(paymentData.tipAmount || 0).toFixed(2)})
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}

                {/* Resumen */}
                {(() => {
                  // Calcular descuento proporcional
                  const proportionalDiscount = account.discount && account.subtotal > 0
                    ? (selectedSubcuentaForPayment.subtotal / account.subtotal) * account.discount
                    : 0;
                  const subtotalConDescuento = selectedSubcuentaForPayment.subtotal - proportionalDiscount;
                  const totalSubcuenta = subtotalConDescuento + (paymentData.tipAmount || 0);
                  const cashReceived = parseFloat(paymentData.cashReceived) || 0;
                  const isInsufficientCash = paymentData.paymentMethod === 'cash' && cashReceived > 0 && cashReceived < totalSubcuenta;

                  return (
                    <div className="bg-gray-100 p-3 rounded-lg mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${selectedSubcuentaForPayment.subtotal.toFixed(2)}</span>
                      </div>
                      {proportionalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-yellow-600">
                          <span>Descuento:</span>
                          <span>-${proportionalDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {(paymentData.tipAmount || 0) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Propina:</span>
                          <span>${(paymentData.tipAmount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>${totalSubcuenta.toFixed(2)}</span>
                      </div>
                      {paymentData.paymentMethod === 'cash' && cashReceived > 0 && (
                        <div className={`flex justify-between text-sm mt-1 ${isInsufficientCash ? 'text-red-600' : 'text-blue-600'}`}>
                          <span>{isInsufficientCash ? 'Faltante:' : 'Cambio:'}</span>
                          <span>${Math.abs(cashReceived - totalSubcuenta).toFixed(2)}</span>
                        </div>
                      )}
                      {isInsufficientCash && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          ⚠️ El efectivo recibido es insuficiente
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button
                  onClick={handlePaySubcuenta}
                  disabled={(() => {
                    const proportionalDiscount = account.discount && account.subtotal > 0
                      ? (selectedSubcuentaForPayment.subtotal / account.subtotal) * account.discount
                      : 0;
                    const subtotalConDescuento = selectedSubcuentaForPayment.subtotal - proportionalDiscount;
                    const totalSubcuenta = subtotalConDescuento + (paymentData.tipAmount || 0);

                    // Validación para efectivo
                    if (paymentData.paymentMethod === 'cash') {
                      const cashReceived = parseFloat(paymentData.cashReceived) || 0;
                      return cashReceived < totalSubcuenta;
                    }

                    // Validación para pago mixto
                    if (paymentData.paymentMethod === 'mixed') {
                      const cashAmt = parseFloat(paymentData.cashReceived) || 0;
                      const cardAmt = parseFloat(paymentData.cardAmount) || 0;
                      const transferAmt = parseFloat(paymentData.transferAmount) || 0;
                      const totalMixed = cashAmt + cardAmt + transferAmt;
                      const difference = Math.abs(totalMixed - totalSubcuenta);
                      return difference > 0.01; // Permitir 1 centavo de diferencia por redondeo
                    }

                    return false;
                  })()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Pagar ${(() => {
                    const proportionalDiscount = account.discount && account.subtotal > 0
                      ? (selectedSubcuentaForPayment.subtotal / account.subtotal) * account.discount
                      : 0;
                    return (selectedSubcuentaForPayment.subtotal - proportionalDiscount + (paymentData.tipAmount || 0)).toFixed(2);
                  })()}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowSubcuentaPaymentModal(false);
                setSelectedSubcuentaForPayment(null);
                setSubcuentasSummary(null);
              }}
              className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Editar Item */}
      {showEditItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Editar Item</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Producto: <span className="font-medium">{selectedItem.name}</span></p>
              <p className="text-sm text-gray-600">Precio unitario: ${selectedItem.price.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Nota */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nota (opcional)
                </label>
                <textarea
                  value={editFormData.note}
                  onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="2"
                  placeholder="Ej: Sin cebolla, extra queso..."
                />
              </div>

              {/* Subcuenta */}
              {account.subcuentas && account.subcuentas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asignar a subcuenta
                  </label>
                  <select
                    value={editFormData.subcuentaName}
                    onChange={(e) => setEditFormData({ ...editFormData, subcuentaName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {account.subcuentas.map(sub => (
                      <option key={sub.name} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitEditItem}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setShowEditItemModal(false);
                  setSelectedItem(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelar Item */}
      {showCancelItemModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Cancelar Item</h2>

            <div className="mb-4">
              <p className="text-gray-700 mb-2">¿Estás seguro de cancelar este item?</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedItem.name}</p>
                <p className="text-sm text-gray-600">Cantidad: {selectedItem.quantity}</p>
                <p className="text-sm text-gray-600">Total: ${(selectedItem.quantity * selectedItem.price).toFixed(2)}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de cancelación (opcional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                rows="2"
                placeholder="Ej: Cliente cambió de opinión, error al ordenar..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmitCancelItem}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Confirmar Cancelación
              </button>
              <button
                onClick={() => {
                  setShowCancelItemModal(false);
                  setSelectedItem(null);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                No Cancelar
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
