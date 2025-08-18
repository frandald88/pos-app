import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [clienteFiltro, setClienteFiltro] = useState("");
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const token = localStorage.getItem("token");
  const [discount, setDiscount] = useState(0);
  const [saleType, setSaleType] = useState("mostrador");
  const [deliveryPerson, setDeliveryPerson] = useState("");
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState("");
  const [userRole, setUserRole] = useState("");
  const [tiendas, setTiendas] = useState([]);
  const [addingCustomProduct, setAddingCustomProduct] = useState(false);
  const [customProduct, setCustomProduct] = useState({ name: "", price: "" });
  const [discountType, setDiscountType] = useState("percentage");
  const [fixedDiscount, setFixedDiscount] = useState(0);
  const [activeCategory, setActiveCategory] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);

  // ✅ NUEVO: Estados para pagos mixtos
  const [paymentType, setPaymentType] = useState("single"); // 'single' o 'mixed'
  const [paymentMethod, setPaymentMethod] = useState("efectivo"); // Para pagos únicos
  const [amountPaid, setAmountPaid] = useState(""); // Para efectivo en pagos únicos
  const [mixedPayments, setMixedPayments] = useState([]); // Para pagos mixtos
  const [customProductError, setCustomProductError] = useState("");

  const fetchProducts = (tiendaId) => {
    axios
      .get(`${apiBaseUrl}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
        params: tiendaId ? { tiendaId } : {},
      })
      .then((res) => setProducts(res.data))
      .catch(() => console.error("Error al cargar productos"));
  };

  const fetchClientes = () => {
    axios
      .get(`${apiBaseUrl}/api/clientes`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setClientes(res.data.data.clientes))
      .catch(() => console.error("Error al cargar clientes"));
  };

  const fetchUserProfile = () => {
    axios
      .get(`${apiBaseUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const user = res.data;
        setUserRole(user.role);
        if (user.role !== "admin") {
          setTiendaSeleccionada(user.tienda);
        }
      })
      .catch((err) => console.error("Error al obtener perfil del usuario", err));
  };

  const fetchTiendas = () => {
    axios
      .get(`${apiBaseUrl}/api/tiendas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTiendas(res.data))
      .catch(() => console.error("Error al cargar tiendas"));
  };

const fetchDeliveryUsers = (tiendaId = null) => {
  console.log('🔍 Fetching delivery users');
  console.log('🔍 User role:', userRole);
  console.log('🔍 tiendaId parameter:', tiendaId);
  
  axios
    .get(`${apiBaseUrl}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log('🔍 All users received:', res.data.length);
      let delivery = res.data.filter((u) => u.role === "repartidor");
      console.log('🔍 Delivery users before filter:', delivery.length);
      
      // ✅ Para admins: filtrar por tienda especificada
      // ✅ Para no-admins: el backend ya filtra, pero podemos filtrar adicional si se especifica tienda
      if (tiendaId && userRole === "admin") {
        delivery = delivery.filter((u) => u.tienda && u.tienda._id === tiendaId);
        console.log('🔍 Admin filtered by tienda:', tiendaId, '- Result:', delivery.length);
      }
      
      setDeliveryUsers(delivery);
      console.log('✅ Final delivery users:', delivery.length);
    })
    .catch((err) => {
      console.error("Error al cargar repartidores", err);
      setDeliveryUsers([]); // ✅ Limpiar en caso de error
    });
};

useEffect(() => {
  fetchClientes();
  fetchUserProfile();
  fetchTiendas();
  // ✅ Solo cargar repartidores inicialmente si NO es admin
  // Los admins cargarán repartidores cuando seleccionen una tienda
}, [token]);

useEffect(() => {
  if (tiendaSeleccionada) {
    fetchProducts(tiendaSeleccionada);
    fetchDeliveryUsers(tiendaSeleccionada); // ✅ Siempre pasar la tienda
  }
}, [tiendaSeleccionada]);

useEffect(() => {
  if (tiendaSeleccionada) {
    fetchProducts(tiendaSeleccionada);
    // ✅ Solo pasar tienda como parámetro si es admin
    if (userRole === "admin") {
      fetchDeliveryUsers(tiendaSeleccionada);
    } else {
      fetchDeliveryUsers(); // Sin parámetro para usuarios no-admin
    }
  }
}, [tiendaSeleccionada, userRole]); // ✅ Agregar userRole como dependencia

  useEffect(() => {
    const preselectedCliente = localStorage.getItem("clienteSeleccionado");
    if (preselectedCliente && clientes.length > 0) {
      setClienteSeleccionado(preselectedCliente);
      const clienteInfo = clientes.find((c) => c._id === preselectedCliente);
      if (clienteInfo) setClienteFiltro(clienteInfo.nombre);
      localStorage.removeItem("clienteSeleccionado");
    }
  }, [clientes]);

  const addToCart = (product) => {
    const found = selected.find((p) => p._id === product._id);
    if (found) {
      setSelected(selected.map((p) => (p._id === product._id ? { ...p, qty: p.qty + 1 } : p)));
    } else {
      setSelected([...selected, { ...product, qty: 1, note: "" }]);
    }
  };

  const removeFromCart = (id) => {
    setSelected(selected.filter((p) => p._id !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
    } else {
      setSelected(selected.map((p) => (p._id === id ? { ...p, qty: newQty } : p)));
    }
  };

  const rawSubtotal = selected.reduce((sum, p) => sum + p.price * p.qty, 0);
  const discountAmount = discountType === "percentage"
    ? rawSubtotal * (discount / 100)
    : fixedDiscount;
  const subtotalWithDiscount = rawSubtotal - discountAmount;
  const totalWithTax = subtotalWithDiscount;

  // ✅ NUEVO: Funciones para pagos mixtos
  const addMixedPayment = () => {
    const remaining = getRemainingAmount();
    if (remaining <= 0) return;

    setMixedPayments([...mixedPayments, {
      id: Date.now(),
      method: "efectivo",
      amount: Math.min(remaining, 100),
      receivedAmount: "",
      reference: ""
    }]);
  };

  const updateMixedPayment = (id, field, value) => {
    setMixedPayments(mixedPayments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    ));
  };

  const removeMixedPayment = (id) => {
    setMixedPayments(mixedPayments.filter(payment => payment.id !== id));
  };

  const getRemainingAmount = () => {
    const totalPaid = mixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return Math.max(0, totalWithTax - totalPaid);
  };

  const getTotalChange = () => {
    return mixedPayments
      .filter(p => p.method === "efectivo")
      .reduce((sum, payment) => {
        const received = parseFloat(payment.receivedAmount) || payment.amount || 0;
        const change = Math.max(0, received - (payment.amount || 0));
        return sum + change;
      }, 0);
  };

  const validateMixedPayments = () => {
    if (mixedPayments.length === 0) return { valid: false, message: "Debe agregar al menos un método de pago" };
    
    const totalPaid = mixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const difference = Math.abs(totalPaid - totalWithTax);
    
    if (difference > 0.01) {
      return { 
        valid: false, 
        message: `Los pagos no coinciden con el total. Diferencia: $${difference.toFixed(2)}`
      };
    }

    // Validar efectivo
    for (const payment of mixedPayments) {
      if (payment.method === "efectivo" && payment.receivedAmount) {
        const received = parseFloat(payment.receivedAmount);
        if (received < payment.amount) {
          return {
            valid: false,
            message: `El monto recibido en efectivo ($${received}) no puede ser menor al monto a pagar ($${payment.amount})`
          };
        }
      }
    }

    return { valid: true, message: "Pagos válidos" };
  };

const handleDiscountChange = (value, type) => {
  let cleanValue = value.replace(/^0+/, '') || '0';
  if (cleanValue.startsWith('.')) {
    cleanValue = '0' + cleanValue;
  }
  
  // ✅ NUEVO: Validar que no sea negativo
  let numericValue = parseFloat(cleanValue) || 0;
  if (numericValue < 0) {
    numericValue = 0;
  }
  
  if (type === "percentage") {
    // ✅ NUEVO: Limitar porcentaje máximo a 100%
    if (numericValue > 100) {
      numericValue = 100;
      setMsg("El descuento no puede ser mayor al 100% ⚠️");
      setTimeout(() => setMsg(""), 3000);
    }
    setDiscount(numericValue);
  } else {
    // ✅ NUEVO: Limitar descuento fijo al subtotal
    if (numericValue > rawSubtotal) {
      numericValue = rawSubtotal;
      setMsg(`El descuento no puede ser mayor al subtotal ($${rawSubtotal.toFixed(2)}) ⚠️`);
      setTimeout(() => setMsg(""), 3000);
    }
    setFixedDiscount(numericValue);
  }
};

  const handleClienteFilterChange = (e) => {
    setClienteFiltro(e.target.value);
    setShowClienteDropdown(true);
  };

  const selectCliente = (cliente) => {
    setClienteSeleccionado(cliente._id);
    setClienteFiltro(cliente.nombre);
    setShowClienteDropdown(false);
  };

  const filteredClientes = clientes
    .filter(
      (c) =>
        c.nombre.toLowerCase().includes(clienteFiltro.toLowerCase()) ||
        c.telefono.includes(clienteFiltro) ||
        c.email.toLowerCase().includes(clienteFiltro.toLowerCase())
    )
    .slice(0, 5);

  // ✅ MEJORADO: Función de venta con soporte para pagos mixtos
  const handleSale = () => {
    if (!tiendaSeleccionada) {
      setMsg("Debes seleccionar una tienda antes de registrar la venta ❌");
      return;
    }

    if (saleType === "domicilio" && !deliveryPerson) {
      setMsg("Debe asignar un repartidor para domicilio ❌");
      return;
    }

    // Validar pagos según el tipo
    if (paymentType === "mixed") {
      const validation = validateMixedPayments();
      if (!validation.valid) {
        setMsg(validation.message + " ❌");
        return;
      }
    } else if (paymentType === "single") {
      if (!paymentMethod) {
        setMsg("Debe seleccionar un método de pago ❌");
        return;
      }
      
      if (paymentMethod === "efectivo" && (!amountPaid || parseFloat(amountPaid) < totalWithTax)) {
        setMsg("El monto recibido debe ser mayor o igual al total ❌");
        return;
      }
    }

    const items = selected.map((p) => ({
      productId: p._id.startsWith("custom-") ? null : p._id,
      quantity: p.qty,
      price: p.price,
      name: p.name,
      note: p.note || ""
    }));

    const saleData = {
      items,
      total: totalWithTax,
      discount: discountAmount,
      paymentType,
      cliente: clienteSeleccionado || null,
      type: saleType,
      tienda: tiendaSeleccionada,
      deliveryPerson: saleType === "domicilio" ? deliveryPerson : null
    };

    // Agregar datos específicos del tipo de pago
    if (paymentType === "single") {
      saleData.method = paymentMethod;
    } else {
      saleData.mixedPayments = mixedPayments.map(payment => ({
        method: payment.method,
        amount: payment.amount,
        reference: payment.reference || "",
        receivedAmount: payment.method === "efectivo" ? parseFloat(payment.receivedAmount) || payment.amount : undefined
      }));
    }

    axios
      .post(`${apiBaseUrl}/api/sales`, saleData, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      .then((response) => {
        setSaleDetails({
          id: response.data.id || Date.now(),
          total: totalWithTax,
          items: items.length,
          cliente: clientes.find(c => c._id === clienteSeleccionado)?.nombre || "Cliente general",
          paymentType,
          method: paymentType === "single" ? paymentMethod : "mixto",
          mixedPayments: paymentType === "mixed" ? mixedPayments : [],
          type: saleType,
          change: paymentType === "single" && paymentMethod === "efectivo" 
            ? Math.max(0, (parseFloat(amountPaid) || 0) - totalWithTax)
            : getTotalChange()
        });

        setShowSuccessModal(true);

        // Limpiar formulario
        setSelected([]);
        setDiscount(0);
        setFixedDiscount(0);
        setAmountPaid("");
        setClienteSeleccionado("");
        setClienteFiltro("");
        setDeliveryPerson("");
        setSaleType("mostrador");
        setPaymentType("single");
        setPaymentMethod("efectivo");
        setMixedPayments([]);
        setShowClienteDropdown(false);
        setMsg("");

        //setTimeout(() => {
         // setShowSuccessModal(false);
       // }, 5000);
      })
      .catch((err) => {
        console.error("Error al registrar venta", err.response?.data || err.message);
        setMsg("Error al registrar venta ❌");
        setTimeout(() => setMsg(""), 5000);
      });
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSaleDetails(null);
  };

  const handleQuote = () => {
    if (!tiendaSeleccionada) {
      setMsg("Debes seleccionar una tienda antes de generar la cotización ❌");
      return;
    }

    axios
      .post(
        `${apiBaseUrl}/api/sales/quote`,
        {
          products: selected,
          clienteId: clienteSeleccionado,
          tienda: tiendaSeleccionada,
          discount: discountType === "percentage" ? discountAmount : fixedDiscount
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      )
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'cotizacion.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMsg("Cotización generada exitosamente ✅");
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => {
        setMsg("Error al generar cotización ❌");
        setTimeout(() => setMsg(""), 5000);
      });
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const groupedByCategory = filteredProducts.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});

  const categories = Object.keys(groupedByCategory);
  const displayProducts = activeCategory 
    ? groupedByCategory[activeCategory] || []
    : filteredProducts;

  return (
    <div className="flex h-full" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Panel izquierdo - Productos */}
      <div className="flex-1 flex flex-col mr-6 rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ backgroundColor: '#f4f6fa' }}>
        {/* Header del panel de productos */}
        <div className="px-6 py-4 text-white" style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Catálogo de Productos</h2>
              <p className="text-sm opacity-80">{products.length} productos disponibles</p>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="flex flex-col space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar productos por nombre o categoría..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{ 
                  '--tw-ring-color': '#46546b',
                  color: '#23334e'
                }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filtros por categoría */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === "" 
                    ? "text-white shadow-md" 
                    : "border border-gray-300"
                }`}
                style={activeCategory === "" 
                  ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }
                  : { color: '#697487', backgroundColor: 'white' }
                }
              >
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === category 
                      ? "text-white shadow-md" 
                      : "border border-gray-300"
                  }`}
                  style={activeCategory === category 
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }
                    : { color: '#697487', backgroundColor: 'white' }
                  }
                >
                  {category} ({groupedByCategory[category]?.length || 0})
                </button>
              ))}
            </div>

            {/* Botón producto personalizado */}
            {!addingCustomProduct && (
              <button
                onClick={() => setAddingCustomProduct(true)}
                className="self-start flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Producto Personalizado</span>
              </button>
            )}
          </div>
        </div>

        {/* Formulario de producto personalizado */}
        {addingCustomProduct && (
          <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
            <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>Nuevo Producto Personalizado</h3>
                <button
                        onClick={() => {
                          setAddingCustomProduct(false);
                          setCustomProductError(""); // ✅ Limpiar error al cerrar
                        }}
                        className="transition-colors duration-200"
                        style={{ color: '#8c95a4' }}
                      >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Descripción del producto"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    '--tw-ring-color': '#46546b',
                    color: '#23334e'
                  }}
                  value={customProduct.name}
                  onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Precio"
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ 
                    '--tw-ring-color': '#46546b',
                    color: '#23334e'
                  }}
                  value={customProduct.price}
                  onChange={(e) => setCustomProduct({ ...customProduct, price: e.target.value })}
                />
              </div>
              {/* ✅ NUEVO: Mensaje de error específico para producto personalizado */}
                {customProductError && (
                  <div className="mt-3 p-3 rounded-lg text-sm font-medium text-center border border-red-200"
                      style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                    {customProductError}
                  </div>
                )}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                      if (!customProduct.name || !customProduct.price) {
                        setCustomProductError("Debes llenar descripción y precio ❌");
                        setTimeout(() => setCustomProductError(""), 3000);
                        return;
                      }
                      addToCart({
                        _id: `custom-${Date.now()}`,
                        name: customProduct.name,
                        price: parseFloat(customProduct.price),
                      });
                      setCustomProduct({ name: "", price: "" });
                      setAddingCustomProduct(false);
                      setCustomProductError(""); // Limpiar error al éxito
                    }}
                  className="flex-1 text-white py-3 rounded-lg transition-all duration-200 font-medium"
                  style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
                >
                  Agregar al Carrito
                </button>
                <button
                  onClick={() => {
                    setAddingCustomProduct(false);
                    setCustomProductError(""); // ✅ Limpiar error al cancelar
                  }}
                  className="px-6 py-3 rounded-lg transition-all duration-200 font-medium"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid de productos */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => addToCart(product)}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-105 group"
                style={{ backgroundColor: '#f4f6fa' }}
              >
                <div className="aspect-square rounded-lg mb-3 flex items-center justify-center transition-all duration-200" 
                     style={{ 
                       background: 'linear-gradient(135deg, #f4f6fa 0%, #8c95a4 100%)'
                     }}
                >
                  <svg className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200"
                    style={{ color: '#23334e' }}>
                  {product.name}
                </h3>
                <p className="text-lg font-bold" style={{ color: '#46546b' }}>${product.price}</p>
                <p className="text-xs mt-1" style={{ color: '#8c95a4' }}>{product.category}</p>
              </div>
            ))}
          </div>
          
          {displayProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64" style={{ color: '#8c95a4' }}>
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-sm">Intenta cambiar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>

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
        {userRole === "admin" && (
          <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
            <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tienda
            </label>
            <select
                value={tiendaSeleccionada}
                onChange={(e) => {
                  const newTienda = e.target.value;
                  setTiendaSeleccionada(newTienda);
                  setDeliveryPerson(""); // Limpiar repartidor seleccionado
                  
                  // ✅ AGREGAR: Limpiar repartidores si no hay tienda seleccionada
                  if (!newTienda) {
                    setDeliveryUsers([]);
                  }
                }}
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
          {selected.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-6" style={{ color: '#8c95a4' }}>
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 8M7 13l2.5 8m0 0L17 17M9.5 21h8" />
              </svg>
              <p className="text-lg font-medium mb-2">Carrito vacío</p>
              <p className="text-sm text-center">Selecciona productos del catálogo para comenzar una venta</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {selected.map((item) => (
                <div key={item._id} className="rounded-lg p-3 border border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm flex-1 mr-2" style={{ color: '#23334e' }}>{item.name}</h4>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="transition-colors duration-200"
                      style={{ color: '#697487' }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.qty - 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                        style={{ 
                          backgroundColor: '#8c95a4',
                          color: 'white'
                        }}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium" style={{ color: '#23334e' }}>{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.qty + 1)}
                        className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors duration-200"
                        style={{ 
                          background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)'
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ color: '#697487' }}>${item.price} c/u</p>
                      <p className="font-bold" style={{ color: '#46546b' }}>${(item.qty * item.price).toFixed(2)}</p>
                    </div>
                  </div>

                  <textarea
                    placeholder="Nota opcional (ej: sin cebolla, extra queso...)"
                    value={item.note || ""}
                    onChange={(e) =>
                      setSelected(selected.map((p) =>
                        p._id === item._id ? { ...p, note: e.target.value } : p
                      ))
                    }
                    className="w-full p-2 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': '#46546b',
                      color: '#23334e'
                    }}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
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
                        clienteSeleccionado === cliente._id ? "border-l-4" : ""
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
                onClick={() => window.location.href = "/admin/clientes"}
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
                  {discountType === "percentage" ? "Porcentaje" : "Monto"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountType === "percentage" ? (discount === 0 ? '' : discount) : (fixedDiscount === 0 ? '' : fixedDiscount)}
                  onChange={(e) => handleDiscountChange(e.target.value, discountType)}
                  placeholder={discountType === "percentage" ? "10" : "100"}
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

            {/* ✅ NUEVO: Selector de tipo de pago */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Tipo de pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentType("single")}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    paymentType === "single" 
                      ? "text-white shadow-md" 
                      : "border-gray-300"
                  }`}
                  style={paymentType === "single"
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }
                    : { color: '#697487', backgroundColor: 'white' }
                  }
                >
                  💳 Un solo método
                </button>
                <button
                  onClick={() => setPaymentType("mixed")}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                    paymentType === "mixed" 
                      ? "text-white shadow-md" 
                      : "border-gray-300"
                  }`}
                  style={paymentType === "mixed"
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }
                    : { color: '#697487', backgroundColor: 'white' }
                  }
                >
                  🔀 Pago mixto
                </button>
              </div>
            </div>

            {/* ✅ NUEVO: Configuración de pago según el tipo */}
            {paymentType === "single" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>Método de pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': '#46546b',
                      color: '#23334e'
                    }}
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                  </select>
                </div>

                {paymentMethod === "efectivo" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>Monto recibido</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ 
                        '--tw-ring-color': '#46546b',
                        color: '#23334e'
                      }}
                    />
                    {amountPaid && (
                      <div className="mt-2 p-2 rounded border" style={{ backgroundColor: 'white', borderColor: '#8c95a4' }}>
                        <div className="text-sm">
                          <span style={{ color: '#697487' }}>Cambio: </span>
                          <span className="font-bold" style={{ color: '#46546b' }}>
                            ${Math.max(0, (parseFloat(amountPaid) || 0) - totalWithTax).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* ✅ NUEVO: Panel de pagos mixtos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium" style={{ color: '#23334e' }}>
                      Métodos de pago ({mixedPayments.length})
                    </label>
                    <button
                      onClick={addMixedPayment}
                      disabled={getRemainingAmount() <= 0}
                      className="text-xs px-3 py-1 rounded-full text-white transition-all duration-200 disabled:opacity-50"
                      style={{ 
                        background: getRemainingAmount() > 0 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                          : '#8c95a4'
                      }}
                    >
                      + Agregar método
                    </button>
                  </div>

                  {/* Mostrar restante por pagar */}
                  {getRemainingAmount() > 0 && (
                    <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
                      <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                        Restante por pagar: ${getRemainingAmount().toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Lista de pagos mixtos */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {mixedPayments.map((payment, index) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-3" style={{ backgroundColor: 'white' }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            Pago #{index + 1}
                          </span>
                          <button
                            onClick={() => removeMixedPayment(payment.id)}
                            className="text-xs px-2 py-1 rounded transition-colors duration-200"
                            style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}
                          >
                            Eliminar
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Método</label>
                            <select
                              value={payment.method}
                              onChange={(e) => updateMixedPayment(payment.id, 'method', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                              style={{ 
                                '--tw-ring-color': '#46546b',
                                color: '#23334e'
                              }}
                            >
                              <option value="efectivo">💵 Efectivo</option>
                              <option value="transferencia">🏦 Transferencia</option>
                              <option value="tarjeta">💳 Tarjeta</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Monto</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={getRemainingAmount() + (payment.amount || 0)}
                              value={payment.amount || ''}
                              onChange={(e) => updateMixedPayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                              style={{ 
                                '--tw-ring-color': '#46546b',
                                color: '#23334e'
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {payment.method === "efectivo" && (
                          <div className="mb-2">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
                              Monto recibido (opcional)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min={payment.amount || 0}
                              value={payment.receivedAmount || ''}
                              onChange={(e) => updateMixedPayment(payment.id, 'receivedAmount', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                              style={{ 
                                '--tw-ring-color': '#46546b',
                                color: '#23334e'
                              }}
                              placeholder={payment.amount ? payment.amount.toString() : "0.00"}
                            />
                            {payment.receivedAmount && parseFloat(payment.receivedAmount) > (payment.amount || 0) && (
                              <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                                Cambio: ${((parseFloat(payment.receivedAmount) || 0) - (payment.amount || 0)).toFixed(2)}
                              </p>
                            )}
                          </div>
                        )}

                        {(payment.method === "transferencia" || payment.method === "tarjeta") && (
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
                              Referencia (opcional)
                            </label>
                            <input
                              type="text"
                              value={payment.reference || ''}
                              onChange={(e) => updateMixedPayment(payment.id, 'reference', e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                              style={{ 
                                '--tw-ring-color': '#46546b',
                                color: '#23334e'
                              }}
                              placeholder="Número de referencia..."
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {mixedPayments.length === 0 && (
                    <div className="text-center py-8" style={{ color: '#8c95a4' }}>
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm">No hay métodos de pago configurados</p>
                      <p className="text-xs">Haz clic en "Agregar método" para comenzar</p>
                    </div>
                  )}

                  {/* Resumen de cambio total */}
                  {getTotalChange() > 0 && (
                    <div className="mt-3 p-2 rounded border" style={{ backgroundColor: '#f0f9f4', borderColor: '#10b981' }}>
                      <div className="text-sm">
                        <span style={{ color: '#047857' }}>Cambio total: </span>
                        <span className="font-bold" style={{ color: '#047857' }}>
                          ${getTotalChange().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
            {saleType === "domicilio" && (
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
                onClick={handleSale}
                disabled={!selected.length || !tiendaSeleccionada || (paymentType === "mixed" && getRemainingAmount() > 0)}
                className="w-full text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
                style={{ 
                  background: (!selected.length || !tiendaSeleccionada || (paymentType === "mixed" && getRemainingAmount() > 0)) 
                    ? '#8c95a4' 
                    : 'linear-gradient(135deg, #697487 0%, #46546b 100%)'
                }}
              >
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Registrar Venta
              </button>
              
              <button
                onClick={handleQuote}
                disabled={!selected.length || !tiendaSeleccionada}
                className="w-full text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                style={{ 
                  background: (!selected.length || !tiendaSeleccionada) ? '#8c95a4' : 'linear-gradient(135deg, #46546b 0%, #23334e 100%)'
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

      {/* ✅ MEJORADO: Modal de éxito con información de pagos mixtos */}
      {showSuccessModal && saleDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={closeSuccessModal}
          ></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full transform transition-all duration-300 scale-100">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center animate-bounce" 
                   style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#23334e' }}>
              ¡Venta Registrada! ✅
            </h2>
            <p className="text-center mb-6" style={{ color: '#697487' }}>
              La venta se ha procesado exitosamente
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>ID de Venta:</span>
                <span className="text-sm font-mono" style={{ color: '#23334e' }}>#{String(saleDetails.id).slice(-6)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>Cliente:</span>
                <span className="text-sm" style={{ color: '#23334e' }}>{saleDetails.cliente}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>Artículos:</span>
                <span className="text-sm" style={{ color: '#23334e' }}>{saleDetails.items} productos</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>Método de pago:</span>
                <span className="text-sm capitalize" style={{ color: '#23334e' }}>
                  {saleDetails.paymentType === 'single' 
                    ? (saleDetails.method === 'efectivo' ? '💵 Efectivo' : 
                       saleDetails.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta')
                    : '🔀 Pago mixto'
                  }
                </span>
              </div>

              {/* ✅ NUEVO: Mostrar detalles de pagos mixtos */}
              {saleDetails.paymentType === 'mixed' && saleDetails.mixedPayments && (
                <div className="border-t pt-2 mt-2">
                  <span className="text-xs font-medium" style={{ color: '#46546b' }}>Detalles del pago:</span>
                  {saleDetails.mixedPayments.map((payment, index) => (
                    <div key={index} className="flex justify-between text-xs mt-1">
                      <span style={{ color: '#697487' }}>
                        {payment.method === 'efectivo' ? '💵' : payment.method === 'transferencia' ? '🏦' : '💳'} {payment.method}:
                      </span>
                      <span style={{ color: '#23334e' }}>${payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium" style={{ color: '#46546b' }}>Tipo de venta:</span>
                <span className="text-sm capitalize" style={{ color: '#23334e' }}>
                  {saleDetails.type === 'mostrador' ? '🏪 Mostrador' : 
                   saleDetails.type === 'recoger' ? '📦 A recoger' : '🚚 A domicilio'}
                </span>
              </div>
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold" style={{ color: '#23334e' }}>Total:</span>
                  <span className="text-lg font-bold" style={{ color: '#10b981' }}>${saleDetails.total.toFixed(2)}</span>
                </div>
                
                {saleDetails.change > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium" style={{ color: '#46546b' }}>Cambio:</span>
                    <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>${saleDetails.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeSuccessModal}
                className="flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
              >
                Continuar Vendiendo
              </button>
              
              <button
                onClick={() => {
                  closeSuccessModal();
                }}
                className="py-3 px-4 rounded-lg font-medium transition-all duration-200 border"
                style={{ 
                  color: '#46546b',
                  borderColor: '#46546b',
                  backgroundColor: 'white'
                }}
              >
                🖨️ Imprimir
              </button>
            </div>

            <button
              onClick={closeSuccessModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ color: '#8c95a4' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-b-2xl animate-pulse" 
                 style={{ 
                   width: '100%',
                   animation: 'shrink 5s linear forwards'
                 }}>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}