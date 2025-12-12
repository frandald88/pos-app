import { useState, useEffect } from 'react';
import devolucionesService from '../services/devolucionesService';

export const useDevolucionesData = () => {
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [msg, setMsg] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');
  const [sale, setSale] = useState(null);
  const [existingReturns, setExistingReturns] = useState(null);
  const [returnedItems, setReturnedItems] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Cargar usuario actual
  const loadCurrentUser = async () => {
    try {
      const userData = await devolucionesService.getCurrentUser();
      setCurrentUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  // Cargar tiendas disponibles
  const loadAvailableStores = async () => {
    try {
      const storesData = await devolucionesService.getAvailableStores();
      setAvailableStores(storesData || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      setAvailableStores([]);
    }
  };

  // Buscar venta por ID
  const fetchSale = async (saleId) => {
    if (!saleId.trim()) {
      setMsg("[ERROR] Se requiere ingresar el ID de la venta para procesar la devolución");
      return;
    }

    setBuscando(true);
    setExistingReturns(null);
    setSale(null);
    setReturnedItems([]);
    setMsg("");
    
    try {
      // Primero verificar si ya existen devoluciones para esta venta
      const existingData = await devolucionesService.getReturnsBySale(saleId);
      setExistingReturns(existingData);
      setBuscando(false);
    } catch (error) {
      // Si no existen devoluciones, continuar con el flujo normal
      try {
        const saleData = await devolucionesService.getSale(saleId);
        console.log('Venta encontrada:', saleData);
        
        const sale = saleData.data || saleData;
        setSale(sale);
        
        // Calcular precios con descuento si aplica
        const discountedItems = sale.items.map((item) => {
          const discountedPrice = sale.discount > 0 
            ? calculateDiscountedPrice(item, sale.total + sale.discount, sale.discount)
            : item.price;

          return {
            productId: item.productId,
            name: item.name,
            quantity: 0,
            maxQuantity: item.quantity,
            unitPrice: item.price,
            discountedPrice: discountedPrice,
            reason: "",
          };
        });
        
        setReturnedItems(discountedItems);
        setMsg("");
        setBuscando(false);
      } catch (saleError) {
        setMsg("[ERROR] Venta no encontrada. Verifica el ID");
        setBuscando(false);
      }
    }
  };

  // Función helper para calcular precio con descuento
  const calculateDiscountedPrice = (item, originalTotal, originalDiscount) => {
    const itemSubtotal = item.price * item.quantity;
    const discountPercentage = originalDiscount / originalTotal;
    const itemDiscount = itemSubtotal * discountPercentage;
    return (item.price - (itemDiscount / item.quantity));
  };

  // Procesar devolución
  const submitReturn = async (returnData) => {
    try {
      setLoading(true);
      setProcessingMsg("");

      const response = await devolucionesService.createReturn(returnData);
      console.log('Devolución creada:', response);

      // Determinar tipo de devolución y mostrar mensaje específico
      const saleUpdated = response.saleUpdated;
      const isPartialReturn = saleUpdated && saleUpdated.remaining > 0;

      const message = isPartialReturn
        ? `[SUCCESS] Devolución parcial registrada exitosamente. Restante: $${saleUpdated.remaining.toFixed(2)}`
        : "[SUCCESS] Devolución total registrada exitosamente";
      
      setMsg(message);
      setProcessingMsg("");
      setSale(null);
      setReturnedItems([]);
      
      setTimeout(() => setMsg(""), 5000);
      return response;
    } catch (error) {
      console.log('Error completo:', error.response?.data);
      if (error.response && error.response.data.message) {
        setProcessingMsg("[ERROR] " + error.response.data.message);
      } else {
        setProcessingMsg("[ERROR] Error inesperado al crear devolución");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de un item
  const updateItemQuantity = (index, field, value) => {
    setReturnedItems((prev) => {
      const updated = [...prev];
      if (field === "quantity") {
        updated[index][field] = value === '' ? 0 : Number(value);
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
  };

  // Limpiar datos
  const clearData = () => {
    setSale(null);
    setExistingReturns(null);
    setReturnedItems([]);
    setMsg("");
    setProcessingMsg("");
  };

  // Limpiar mensajes
  const clearMessages = () => {
    setMsg("");
    setProcessingMsg("");
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadCurrentUser();
    loadAvailableStores();
  }, []);

  return {
    // Estados
    loading,
    buscando,
    msg,
    processingMsg,
    sale,
    existingReturns,
    returnedItems,
    availableStores,
    currentUser,
    
    // Acciones
    fetchSale,
    submitReturn,
    updateItemQuantity,
    clearData,
    clearMessages,
    loadCurrentUser,
    loadAvailableStores,
    
    // Setters
    setMsg,
    setProcessingMsg,
    setSale,
    setExistingReturns,
    setReturnedItems
  };
};