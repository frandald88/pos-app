import { useState, useMemo } from 'react';

export const useCart = () => {
  const [selected, setSelected] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage');
  const [fixedDiscount, setFixedDiscount] = useState(0);

  // Agregar producto al carrito
  const addToCart = (product) => {
    const found = selected.find(p => p._id === product._id);
    if (found) {
      setSelected(selected.map(p => 
        p._id === product._id ? { ...p, qty: p.qty + 1 } : p
      ));
    } else {
      setSelected([...selected, { ...product, qty: 1, note: '' }]);
    }
  };

  // Remover producto del carrito
  const removeFromCart = (id) => {
    setSelected(selected.filter(p => p._id !== id));
  };

  // Actualizar cantidad
  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
    } else {
      setSelected(selected.map(p => 
        p._id === id ? { ...p, qty: newQty } : p
      ));
    }
  };

  // Actualizar nota del producto
  const updateNote = (id, note) => {
    setSelected(selected.map(p => 
      p._id === id ? { ...p, note } : p
    ));
  };

  // Limpiar carrito
  const clearCart = () => {
    setSelected([]);
    setDiscount(0);
    setFixedDiscount(0);
  };

  // Manejar cambio de descuento con validaciones
  const handleDiscountChange = (value, type, rawSubtotal, setMsg) => {
    let cleanValue = value.replace(/^0+/, '') || '0';
    if (cleanValue.startsWith('.')) {
      cleanValue = '0' + cleanValue;
    }
    
    let numericValue = parseFloat(cleanValue) || 0;
    if (numericValue < 0) {
      numericValue = 0;
    }
    
    if (type === 'percentage') {
      if (numericValue > 100) {
        numericValue = 100;
        setMsg && setMsg('El descuento no puede ser mayor al 100% ⚠️');
        setTimeout(() => setMsg && setMsg(''), 3000);
      }
      setDiscount(numericValue);
    } else {
      if (numericValue > rawSubtotal) {
        numericValue = rawSubtotal;
        setMsg && setMsg(`El descuento no puede ser mayor al subtotal ($${rawSubtotal.toFixed(2)}) ⚠️`);
        setTimeout(() => setMsg && setMsg(''), 3000);
      }
      setFixedDiscount(numericValue);
    }
  };

  // Calcular totales
  const totals = useMemo(() => {
    const rawSubtotal = selected.reduce((sum, p) => sum + p.price * p.qty, 0);
    const discountAmount = discountType === 'percentage'
      ? rawSubtotal * (discount / 100)
      : fixedDiscount;
    const subtotalWithDiscount = rawSubtotal - discountAmount;
    const totalWithTax = subtotalWithDiscount;

    return {
      rawSubtotal,
      discountAmount,
      subtotalWithDiscount,
      totalWithTax
    };
  }, [selected, discount, discountType, fixedDiscount]);

  return {
    // Cart state
    selected,
    discount,
    discountType,
    fixedDiscount,
    
    // Cart actions
    addToCart,
    removeFromCart,
    updateQuantity,
    updateNote,
    clearCart,
    handleDiscountChange,
    
    // Discount controls
    setDiscountType,
    
    // Computed values
    ...totals
  };
};