import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
      name: "",
      sku: "",
      price: "", // ✅ CAMBIADO: vacío en lugar de 0
      stock: "", // ✅ CAMBIADO: vacío en lugar de 0
      category: "",
      tienda: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState("");
  const [userRole, setUserRole] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTienda, setFiltroTienda] = useState("");
  
  // ✅ ESTADOS para SKU autogenerado
  const [skuAutogenerado, setSkuAutogenerado] = useState("");
  const [usarSkuManual, setUsarSkuManual] = useState(false);

  // ✅ ESTADOS para las mejoras de reabastecimiento
  const [categorias, setCategorias] = useState([]);
  const [mostrarReabastecimiento, setMostrarReabastecimiento] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadRestock, setCantidadRestock] = useState(""); // ✅ UNA SOLA DECLARACIÓN
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [busquedaRestock, setBusquedaRestock] = useState("");
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [mostrarProductosBajoStock, setMostrarProductosBajoStock] = useState(false);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [stockActualizado, setStockActualizado] = useState(false);
  const token = localStorage.getItem("token");

  const filtrarCategorias = (termino) => {
  if (!termino || termino.length < 2) {
    setCategoriasFiltradas([]);
    return;
  }
  
  const filtradas = categorias.filter(cat => 
    cat.toLowerCase().includes(termino.toLowerCase())
  ).slice(0, 8); // Máximo 8 sugerencias
  
  setCategoriasFiltradas(filtradas);
};

useEffect(() => {
  const handleClickOutside = () => {
    setCategoriasFiltradas([]);
  };
  
  document.addEventListener('click', handleClickOutside);
  return () => document.removeEventListener('click', handleClickOutside);
}, []);

  // ✅ FUNCIÓN para obtener siguiente SKU
 const fetchNextSKU = () => {
  // Solo obtener SKU si NO estamos editando y NO estamos usando SKU manual
  if (editingId || usarSkuManual) {
    return;
  }
  
  axios
    .get(`${apiBaseUrl}/api/products/next-sku`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log('🔢 Nuevo SKU obtenido:', res.data.nextSKU);
      setSkuAutogenerado(res.data.nextSKU);
      // ✅ IMPORTANTE: Solo actualizar el formulario si NO estamos editando
      if (!editingId && !usarSkuManual) {
        setForm(prevForm => ({ ...prevForm, sku: res.data.nextSKU }));
      }
    })
    .catch(() => console.error("Error al obtener SKU"));
};

  const fetchProducts = () => {
    setCargando(true);
    axios
      .get(`${apiBaseUrl}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setProducts(res.data);
        setCargando(false);
      })
      .catch(() => {
        setMsg("Error al cargar productos ❌");
        setCargando(false);
      });
  };

  const fetchTiendas = () => {
    axios
      .get(`${apiBaseUrl}/api/tiendas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTiendas(res.data))
      .catch(() => console.error("Error al cargar tiendas"));
  };

  const fetchUserProfile = () => {
    axios
      .get(`${apiBaseUrl}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserRole(res.data.role))
      .catch(() => console.error("Error al cargar perfil"));
  };

  // ✅ FUNCIÓN para obtener categorías
  const fetchCategorias = () => {
  axios
    .get(`${apiBaseUrl}/api/products/categories-with-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      // Si el backend devuelve conteos, ordenar por uso
      if (Array.isArray(res.data) && res.data[0]?.count !== undefined) {
        const sortedCategories = res.data
          .sort((a, b) => b.count - a.count) // Ordenar por count descendente
          .map(item => item._id); // Extraer solo los nombres
        setCategorias(sortedCategories);
      } else {
        // Fallback: orden alfabético
        setCategorias(res.data.sort());
      }
    })
    .catch(() => console.error("Error al cargar categorías"));
};

  // ✅ FUNCIÓN para obtener productos con bajo stock
  const fetchProductosBajoStock = () => {
    axios
      .get(`${apiBaseUrl}/api/products/low-stock`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 }
      })
      .then((res) => setProductosBajoStock(res.data))
      .catch(() => console.error("Error al cargar productos con bajo stock"));
  };

  // ✅ FUNCIÓN para buscar productos
  const buscarProductos = (termino) => {
    if (termino.length < 2) {
      setProductosEncontrados([]);
      return;
    }
    
    axios
      .get(`${apiBaseUrl}/api/products/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: termino }
      })
      .then((res) => setProductosEncontrados(res.data))
      .catch(() => console.error("Error al buscar productos"));
  };

  useEffect(() => {
    fetchProducts();
    fetchTiendas();
    fetchUserProfile();
    fetchCategorias();
    fetchProductosBajoStock();
    fetchNextSKU(); // ✅ Obtener SKU inicial
  }, []);

    useEffect(() => {
  if (!mostrarFormulario) {
    setCategoriasFiltradas([]);
    setMostrarTodasCategorias(false);
    setStockActualizado(false);
  }
}, [mostrarFormulario]);



const limpiarFormularioCompleto = () => {
  console.log('🧹 Limpiando formulario completo...');
  
  // Limpiar formulario principal
  setForm({ 
    name: "", 
    sku: "", 
    price: "", 
    stock: "", 
    category: "", 
    tienda: "" 
  });


  
  // Limpiar estados de edición
  setEditingId(null);
  setTiendaSeleccionada("");
  setMostrarFormulario(false);
  
  // Limpiar estados de SKU
  setUsarSkuManual(false);
  setSkuAutogenerado("");
  
  // Limpiar estados de categorías
  setCategoriasFiltradas([]);
  setMostrarTodasCategorias(false);
  
  // Limpiar estados de stock actualizado
  setStockActualizado(false);
  
  // Obtener nuevo SKU para el próximo producto
  fetchNextSKU();
};

  // ✅ FUNCIÓN para reabastecer stock
const handleReabastecimiento = (e) => {
  e.preventDefault();
  
  if (!productoSeleccionado || cantidadRestock === "" || parseInt(cantidadRestock) <= 0) {
    setMsg("Selecciona un producto y cantidad válida ❌");
    return;
  }

  setCargando(true);
  
  const payload = {
    quantity: parseInt(cantidadRestock),
    ...(nuevoPrecio && { price: parseFloat(nuevoPrecio) })
  };

  console.log('🔍 Reabastecimiento payload:', {
    productId: productoSeleccionado._id,
    currentStock: productoSeleccionado.stock,
    addingQuantity: parseInt(cantidadRestock),
    expectedNewStock: productoSeleccionado.stock + parseInt(cantidadRestock)
  });

  axios
    .post(`${apiBaseUrl}/api/products/${productoSeleccionado._id}/restock`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log('✅ Reabastecimiento exitoso:', res.data);
      
      // ✅ NUEVA LÓGICA: Si estamos editando el mismo producto, actualizar el formulario
      if (editingId && editingId === productoSeleccionado._id && res.data.product) {
          console.log('🔄 Actualizando formulario de edición con nuevo stock:', res.data.product.stock);
          setForm(prevForm => ({
            ...prevForm,
            stock: res.data.product.stock,
            ...(res.data.product.price && { price: res.data.product.price })
          }));
          
          // ✅ NUEVO: Mostrar confirmación visual
          setStockActualizado(true);
          setTimeout(() => setStockActualizado(false), 3000);
        }
      
      setMsg(res.data.message + " ✅");
      setProductoSeleccionado(null);
      setCantidadRestock("");
      setNuevoPrecio("");
      setBusquedaRestock("");
      setProductosEncontrados([]);
      setMostrarReabastecimiento(false);
      
      // Actualizar listas
      fetchProducts();
      fetchProductosBajoStock();
      
      setTimeout(() => setMsg(""), 3000);
    })
    .catch((err) => {
      console.error('❌ Error en reabastecimiento:', err.response?.data || err);
      setMsg(`Error al reabastecer producto: ${err.response?.data?.message || err.message} ❌`);
    })
    .finally(() => {
      setCargando(false);
    });
};
 
const verificarCambioStock = async (productId) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/products/${productId}/debug`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('📊 Stock después de reabastecimiento:', response.data.product.stock);
  } catch (err) {
    console.error('Error verificando stock:', err);
  }
};

const handleSubmit = (e) => {
  e.preventDefault();

  if (!form.name || !form.category) {
    setMsg("Por favor completa todos los campos requeridos ❌");
    return;
  }

  if (userRole === "admin" && !tiendaSeleccionada) {
    setMsg("Selecciona una tienda ❌");
    return;
  }

  setCargando(true);

  // ✅ CORRECCIÓN PRINCIPAL: Payload diferente para crear vs editar
  const payload = editingId 
    ? {
        // ❌ AL EDITAR: NO incluir stock (se maneja solo con reabastecimiento)
        name: form.name,
        sku: form.sku,
        price: form.price === "" ? 0 : parseFloat(form.price),
        category: form.category,
        ...(userRole === "admin" && { tienda: tiendaSeleccionada }),
      }
    : {
        // ✅ AL CREAR: Incluir stock inicial
        name: form.name,
        sku: form.sku,
        price: form.price === "" ? 0 : parseFloat(form.price),
        stock: form.stock === "" ? 0 : parseInt(form.stock),
        category: form.category,
        ...(userRole === "admin" && { tienda: tiendaSeleccionada }),
      };

  const url = editingId
    ? `${apiBaseUrl}/api/products/${editingId}`
    : `${apiBaseUrl}/api/products`;

  const method = editingId ? "put" : "post";

  console.log('🔍 Payload enviado:', payload);

  axios[method](url, payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(() => {
      setMsg(editingId ? "Producto actualizado exitosamente ✅" : "Producto creado exitosamente ✅");
      
      // ✅ CAMBIO PRINCIPAL: Usar función centralizada de limpieza
      limpiarFormularioCompleto();
      
      // Actualizar listas
      fetchProducts();
      fetchCategorias();
      setTimeout(() => setMsg(""), 3000);
    })
    .catch((err) => {
      console.error('❌ Error al guardar producto:', err);
      setMsg("Error al guardar producto ❌");
      setCargando(false);
    });
};

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      sku: p.sku,
      price: p.price,
      stock: p.stock,
      category: p.category,
      tienda: p.tienda?._id || ""
    });
    setEditingId(p._id);
    setTiendaSeleccionada(p.tienda?._id || "");
    setUsarSkuManual(true);
    setMostrarFormulario(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    
    setCargando(true);
    axios
      .delete(`${apiBaseUrl}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        setMsg("Producto eliminado exitosamente ✅");
        fetchProducts();
        fetchCategorias();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch(() => {
        setMsg("Error al eliminar producto ❌");
        setCargando(false);
      });
  };

  const handleCancelar = () => {
  console.log('❌ Cancelando formulario...');
  limpiarFormularioCompleto();
};

  const handleCancelarReabastecimiento = () => {
    setMostrarReabastecimiento(false);
    setProductoSeleccionado(null);
    setCantidadRestock("");
    setNuevoPrecio("");
    setBusquedaRestock("");
    setProductosEncontrados([]);
  };

  // Filtrar productos
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = filtroCategoria === "" || p.category === filtroCategoria;
    const matchesTienda = filtroTienda === "" || p.tienda?._id === filtroTienda;
    
    return matchesSearch && matchesCategory && matchesTienda;
  });

  // Estadísticas del inventario
  const getInventoryStats = () => {
    return {
      total: products.length,
      sinStock: products.filter(p => p.stock === 0).length,
      bajoStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
      valorTotal: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    };
  };

  const stats = getInventoryStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { color: '#ef4444', label: 'Sin stock', icon: '❌' };
    if (stock <= 10) return { color: '#f59e0b', label: 'Bajo stock', icon: '⚠️' };
    return { color: '#10b981', label: 'En stock', icon: '✅' };
  };

const scrollToElement = (elementId, offset = 100) => {
  // Eliminar logs de debugging en producción
  setTimeout(() => {
    const element = document.getElementById(elementId);
    
    if (element) {
      // Scroll suave y confiable
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      // Ajustar offset
      setTimeout(() => {
        const currentScroll = window.pageYOffset;
        window.scrollTo({
          top: currentScroll - offset,
          behavior: 'smooth'
        });
      }, 100);
      
      // Highlight visual elegante
      element.style.transition = 'all 0.3s ease';
      element.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
      element.style.transform = 'scale(1.01)';
      
      setTimeout(() => {
        element.style.boxShadow = '';
        element.style.transform = '';
      }, 2000);
    }
  }, 200);
};

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{ color: '#23334e' }}
              >
                Gestión de Productos
              </h1>
              <p style={{ color: '#697487' }} className="text-sm sm:text-lg">
                Administra tu inventario y controla el stock de productos
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                  onClick={() => {
                    setMostrarReabastecimiento(!mostrarReabastecimiento);
                    if (mostrarReabastecimiento) {
                      handleCancelarReabastecimiento();
                    }
                  }}
                  className="px-4 sm:px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
                  style={{ backgroundColor: '#10b981' }}
                  disabled={cargando}
                >
                  <span className="hidden sm:inline">📦 Reabastecer</span>
                  <span className="sm:hidden">📦</span>
                </button>
              
              <button
                  onClick={() => {
                    if (mostrarFormulario) {
                      limpiarFormularioCompleto();
                    } else {
                      limpiarFormularioCompleto();
                      setMostrarFormulario(true);
                    }
                  }}
                  className="px-4 sm:px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  <span className="hidden sm:inline">{mostrarFormulario ? "Cancelar" : "Nuevo Producto"}</span>
                  <span className="sm:hidden">{mostrarFormulario ? "✖" : "➕"}</span>
                </button>
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('✅') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{msg}</p>
          </div>
        )}

        {/* Alertas de stock bajo */}
        {productosBajoStock.length > 0 && (
          <div className="mb-8 bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">
                    Productos con Stock Bajo
                  </h3>
                  <p className="text-sm text-orange-600">
                    {productosBajoStock.length} productos necesitan reabastecimiento
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMostrarProductosBajoStock(!mostrarProductosBajoStock)}
                className="text-orange-600 hover:text-orange-800 font-medium"
              >
                {mostrarProductosBajoStock ? "Ocultar" : "Ver todos"}
              </button>
            </div>
            
            {mostrarProductosBajoStock && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productosBajoStock.map((producto) => (
                  <div key={producto._id} className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 truncate">{producto.name}</h4>
                      <span className="text-orange-600 font-bold">
                        {producto.stock} {producto.stock === 0 ? '❌' : '⚠️'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">SKU: {producto.sku}</p>
                    <button
                      onClick={() => {
                        setProductoSeleccionado(producto);
                        setMostrarReabastecimiento(true);
                      }}
                      className="w-full px-3 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 transition-colors"
                    >
                      🔄 Reabastecer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Estadísticas del inventario */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-2xl" style={{ backgroundColor: '#23334e' }}>
                📦
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-bold truncate" style={{ color: '#23334e' }}>
                  {stats.total}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: '#697487' }}>
                  <span className="hidden sm:inline">Total Productos</span>
                  <span className="sm:hidden">Total</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-2xl bg-red-100">
                ❌
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-bold text-red-600 truncate">
                  {stats.sinStock}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: '#697487' }}>
                  <span className="hidden sm:inline">Sin Stock</span>
                  <span className="sm:hidden">Sin Stock</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-2xl bg-yellow-100">
                ⚠️
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg sm:text-2xl font-bold text-yellow-600 truncate">
                  {stats.bajoStock}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: '#697487' }}>
                  <span className="hidden sm:inline">Bajo Stock</span>
                  <span className="sm:hidden">Bajo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-lg sm:text-2xl" style={{ backgroundColor: '#10b981', color: 'white' }}>
                💰
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm sm:text-lg font-bold truncate" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.valorTotal)}
                </div>
                <div className="text-xs sm:text-sm" style={{ color: '#697487' }}>
                  <span className="hidden sm:inline">Valor Total</span>
                  <span className="sm:hidden">Valor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de reabastecimiento */}
        {mostrarReabastecimiento && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
            style={{ zIndex: 60 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelarReabastecimiento();
              }
            }}
          >
            <div 
              className="bg-white rounded-lg sm:rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 rounded-t-lg sm:rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-semibold text-green-800 flex items-center gap-2">
                    📦 Reabastecer Producto Existente
                  </h2>
                  <button
                    onClick={handleCancelarReabastecimiento}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6">
            
            <form onSubmit={handleReabastecimiento}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Búsqueda de producto */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Buscar Producto
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={busquedaRestock}
                      onChange={(e) => {
                        setBusquedaRestock(e.target.value);
                        buscarProductos(e.target.value);
                      }}
                      placeholder="Buscar por nombre, SKU o categoría..."
                      className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#10b981'
                      }}
                    />
                    <div className="absolute left-3 top-3.5">
                      🔍
                    </div>
                  </div>
                  
                  {/* Resultados de búsqueda */}
                  {productosEncontrados.length > 0 && (
                    <div className="mt-4 border rounded-lg max-h-60 overflow-y-auto">
                      {productosEncontrados.map((producto) => (
                        <div
                          key={producto._id}
                          onClick={() => {
                            setProductoSeleccionado(producto);
                            setBusquedaRestock(producto.name);
                            setProductosEncontrados([]);
                          }}
                          className="p-4 border-b hover:bg-green-50 cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-gray-800">{producto.name}</div>
                              <div className="text-sm text-gray-600">
                                SKU: {producto.sku} • Stock actual: {producto.stock} • {formatCurrency(producto.price)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                producto.stock === 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : producto.stock <= 10 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {getStockStatus(producto.stock).label}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Producto seleccionado */}
                {productoSeleccionado && (
                  <div className="lg:col-span-2 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Producto Seleccionado:</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{productoSeleccionado.name}</div>
                        <div className="text-sm text-gray-600">
                          SKU: {productoSeleccionado.sku} • Stock actual: {productoSeleccionado.stock} • {formatCurrency(productoSeleccionado.price)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProductoSeleccionado(null);
                          setBusquedaRestock("");
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                )}

                {/* Cantidad a agregar */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Cantidad a Agregar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidadRestock}
                    onChange={(e) => setCantidadRestock(e.target.value)}
                    placeholder="Cantidad"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#10b981'
                    }}
                    required
                  />
                  {productoSeleccionado && cantidadRestock && parseInt(cantidadRestock) > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Stock resultante: {productoSeleccionado.stock + parseInt(cantidadRestock)}
                    </p>
                  )}
                </div>

                {/* Nuevo precio (opcional) */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Actualizar Precio (Opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={nuevoPrecio}
                    onChange={(e) => setNuevoPrecio(e.target.value)}
                    placeholder="Precio actual: $0.00"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#10b981'
                    }}
                  />
                  {productoSeleccionado && (
                    <p className="text-sm text-gray-600 mt-1">
                      Precio actual: {formatCurrency(productoSeleccionado.price)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#10b981' }}
                  disabled={cargando || !productoSeleccionado || !cantidadRestock || parseInt(cantidadRestock) <= 0}
                >
                  {cargando ? "Reabasteciendo..." : "📦 Confirmar Reabastecimiento"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelarReabastecimiento}
                  className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para editar producto */}
        {mostrarFormulario && editingId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelar();
              }
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    ✏️ Editar Producto
                  </h2>
                  <button
                    onClick={handleCancelar}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Laptop Dell Inspiron"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  />
                </div>

                {/* Campo SKU con autogeneración */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    SKU {!editingId && "(Se genera automáticamente)"}
                  </label>
                  
                  {!editingId && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-blue-800">
                            SKU Automático: <span className="font-mono">{skuAutogenerado}</span>
                          </div>
                          <div className="text-xs text-blue-600">
                            Se asignará automáticamente al crear el producto
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUsarSkuManual(!usarSkuManual);
                            if (!usarSkuManual) {
                              setForm({ ...form, sku: "" });
                            } else {
                              setForm({ ...form, sku: skuAutogenerado });
                            }
                          }}
                          className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                          style={{ 
                            backgroundColor: usarSkuManual ? '#ef4444' : '#10b981',
                            color: 'white'
                          }}
                        >
                          {usarSkuManual ? "🔄 Usar Automático" : "✏️ Personalizar"}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {(editingId || usarSkuManual) && (
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder={editingId ? "SKU del producto" : "Ej: PROD-001 (opcional)"}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      required={editingId}
                    />
                  )}
                  
                  {!editingId && usarSkuManual && (
                    <p className="text-xs text-gray-600 mt-1">
                      💡 Deja vacío para usar SKU automático ({skuAutogenerado})
                    </p>
                  )}
                </div>

                {/* Campo de categoría con dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Categoría *
                  </label>
                  
                  {/* Input principal con búsqueda inteligente */}
                  <div className="relative">
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => {
                        setForm({ ...form, category: e.target.value });
                        filtrarCategorias(e.target.value);
                      }}
                      onFocus={() => {
                        if (form.category) {
                          filtrarCategorias(form.category);
                        }
                      }}
                      placeholder="Escribe para buscar o crear nueva categoría..."
                      className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      required
                    />
                    
                    {/* Icono de búsqueda */}
                    <div className="absolute right-3 top-3.5 pointer-events-none">
                      <svg className="w-5 h-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Dropdown de sugerencias dinámicas */}
                  {categoriasFiltradas.length > 0 && (
                    <div className="mt-2 border rounded-lg shadow-lg bg-white max-h-60 overflow-y-auto z-10 relative">
                      <div className="p-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-600">
                          📂 Categorías encontradas ({categoriasFiltradas.length})
                        </span>
                      </div>
                      {categoriasFiltradas.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, category: cat });
                            setCategoriasFiltradas([]);
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 transition-colors flex items-center gap-2"
                        >
                          <span>📂</span>
                          <span className="font-medium">{cat}</span>
                          <span className="ml-auto text-xs text-gray-500">clic para seleccionar</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Categorías populares/recientes (solo las más usadas) */}
                  {categorias.length > 0 && !categoriasFiltradas.length && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: '#697487' }}>
                          Categorías populares:
                        </span>
                        {categorias.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setMostrarTodasCategorias(!mostrarTodasCategorias)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {mostrarTodasCategorias ? '▲ Mostrar menos' : `▼ Ver todas (${categorias.length})`}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {(mostrarTodasCategorias ? categorias : categorias.slice(0, 6)).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setForm({ ...form, category: cat })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border ${
                              form.category === cat
                                ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                            }`}
                          >
                            📂 {cat}
                          </button>
                        ))}
                        
                        {!mostrarTodasCategorias && categorias.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setMostrarTodasCategorias(true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            +{categorias.length - 6} más...
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Estadísticas de categorías (opcional) */}
                  {categorias.length > 10 && !mostrarTodasCategorias && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span>📊</span>
                        <span className="text-sm">
                          Tienes <strong>{categorias.length} categorías</strong> registradas. 
                          Usa la búsqueda para encontrar rápidamente la que necesitas.
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicador de nueva categoría */}
                  {form.category && !categorias.includes(form.category) && form.category.trim() !== '' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <span>✨</span>
                        <span className="text-sm font-medium">
                          Nueva categoría: "{form.category}"
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>💡</span>
                        <span>Esta categoría se creará automáticamente y estará disponible para futuros productos</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmación de categoría existente */}
                  {form.category && categorias.includes(form.category) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span>✅</span>
                        <span className="text-sm font-medium">Categoría existente: "{form.category}"</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>

                {/* Campo de Stock - Solo visible al CREAR producto */}
                  {!editingId && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Stock Inicial
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        placeholder="0"
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: '#697487' }}>
                        💡 Para modificar stock después de crear el producto, usa la función "Reabastecer"
                      </p>
                    </div>
                  )}
                  {/* Información de Stock Actual - Solo visible al EDITAR producto */}
                    {editingId && (
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Stock Actual
                        </label>
                        <div 
                          className={`p-4 border rounded-lg transition-all duration-300 ${
                            stockActualizado 
                              ? 'bg-gradient-to-r from-green-100 to-blue-100 border-green-300' 
                              : 'bg-gradient-to-r from-gray-50 to-blue-50'
                          }`} 
                          style={{ borderColor: stockActualizado ? '#10b981' : '#e5e7eb' }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xl font-bold flex items-center gap-2" style={{ color: '#23334e' }}>
                                {form.stock} unidades
                                {stockActualizado && <span className="text-green-600">✨</span>}
                              </div>
                              <div className="text-sm" style={{ color: '#697487' }}>
                                {stockActualizado ? '¡Stock actualizado exitosamente!' : 'Stock disponible'}
                              </div>
                              {/* ✅ MANTENER: Mostrar si el stock cambió recientemente */}
                              {msg.includes('Stock actualizado') && !stockActualizado && (
                                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                  <span>✨</span>
                                  <span>Actualizado recientemente</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  // Buscar el producto actual para abrir el reabastecimiento
                                  const currentProduct = products.find(p => p._id === editingId);
                                  if (currentProduct) {
                                    // ✅ MEJORA: Usar el stock más actualizado del formulario
                                    const productWithCurrentStock = {
                                      ...currentProduct,
                                      stock: parseInt(form.stock) || currentProduct.stock
                                    };
                                    setProductoSeleccionado(productWithCurrentStock);
                                    setBusquedaRestock(currentProduct.name); // Preseleccionar en búsqueda
                                    setMostrarReabastecimiento(true);
                                  }
                                }}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-200 hover:shadow-md flex items-center gap-2"
                                style={{ backgroundColor: '#10b981' }}
                              >
                                📦 Reabastecer Stock
                              </button>
                              <div className="text-xs text-gray-500">
                                Se actualizará automáticamente
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs mt-1" style={{ color: '#697487' }}>
                          ℹ️ El stock se actualiza en tiempo real cuando usas "Reabastecer"
                        </p>
                      </div>
                    )}

                {userRole === "admin" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Tienda *
                    </label>
                    <select
                      value={tiendaSeleccionada}
                      onChange={(e) => setTiendaSeleccionada(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      required
                    >
                      <option value="">-- Selecciona tienda --</option>
                      {tiendas.map((t) => (
                        <option key={t._id} value={t._id}>
                          🏪 {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  {cargando ? (editingId ? "Actualizando..." : "Creando...") : (editingId ? "Actualizar Producto" : "Crear Producto")}
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal para nuevo producto */}
        {mostrarFormulario && !editingId && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelar();
              }
            }}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                    ➕ Agregar Nuevo Producto
                  </h2>
                  <button
                    onClick={handleCancelar}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Laptop Dell Inspiron"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  />
                </div>

                {/* Campo SKU con autogeneración */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    SKU (Se genera automáticamente)
                  </label>
                  
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-800">
                          SKU Automático: <span className="font-mono">{skuAutogenerado}</span>
                        </div>
                        <div className="text-xs text-blue-600">
                          Se asignará automáticamente al crear el producto
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUsarSkuManual(!usarSkuManual);
                          if (!usarSkuManual) {
                            setForm({ ...form, sku: "" });
                          } else {
                            setForm({ ...form, sku: skuAutogenerado });
                          }
                        }}
                        className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                        style={{ 
                          backgroundColor: usarSkuManual ? '#ef4444' : '#10b981',
                          color: 'white'
                        }}
                      >
                        {usarSkuManual ? "🔄 Usar Automático" : "✏️ Personalizar"}
                      </button>
                    </div>
                  </div>
                  
                  {usarSkuManual && (
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="Ej: PROD-001 (opcional)"
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                    />
                  )}
                  
                  {usarSkuManual && (
                    <p className="text-xs text-gray-600 mt-1">
                      💡 Deja vacío para usar SKU automático ({skuAutogenerado})
                    </p>
                  )}
                </div>

                {/* Campo de categoría con dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Categoría *
                  </label>
                  
                  {/* Input principal con búsqueda inteligente */}
                  <div className="relative">
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => {
                        setForm({ ...form, category: e.target.value });
                        filtrarCategorias(e.target.value);
                      }}
                      onFocus={() => {
                        if (form.category) {
                          filtrarCategorias(form.category);
                        }
                      }}
                      placeholder="Escribe para buscar o crear nueva categoría..."
                      className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      required
                    />
                    
                    {/* Icono de búsqueda */}
                    <div className="absolute right-3 top-3.5 pointer-events-none">
                      <svg className="w-5 h-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Dropdown de sugerencias dinámicas */}
                  {categoriasFiltradas.length > 0 && (
                    <div className="mt-2 border rounded-lg shadow-lg bg-white max-h-60 overflow-y-auto z-10 relative">
                      <div className="p-2 bg-gray-50 border-b">
                        <span className="text-xs font-medium text-gray-600">
                          📂 Categorías encontradas ({categoriasFiltradas.length})
                        </span>
                      </div>
                      {categoriasFiltradas.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, category: cat });
                            setCategoriasFiltradas([]);
                          }}
                          className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 transition-colors flex items-center gap-2"
                        >
                          <span>📂</span>
                          <span className="font-medium">{cat}</span>
                          <span className="ml-auto text-xs text-gray-500">clic para seleccionar</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Categorías populares/recientes (solo las más usadas) */}
                  {categorias.length > 0 && !categoriasFiltradas.length && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: '#697487' }}>
                          Categorías populares:
                        </span>
                        {categorias.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setMostrarTodasCategorias(!mostrarTodasCategorias)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {mostrarTodasCategorias ? '▲ Mostrar menos' : `▼ Ver todas (${categorias.length})`}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {(mostrarTodasCategorias ? categorias : categorias.slice(0, 6)).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setForm({ ...form, category: cat })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border ${
                              form.category === cat
                                ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                            }`}
                          >
                            📂 {cat}
                          </button>
                        ))}
                        
                        {!mostrarTodasCategorias && categorias.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setMostrarTodasCategorias(true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-50 border border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            +{categorias.length - 6} más...
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Estadísticas de categorías (opcional) */}
                  {categorias.length > 10 && !mostrarTodasCategorias && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span>📊</span>
                        <span className="text-sm">
                          Tienes <strong>{categorias.length} categorías</strong> registradas. 
                          Usa la búsqueda para encontrar rápidamente la que necesitas.
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Indicador de nueva categoría */}
                  {form.category && !categorias.includes(form.category) && form.category.trim() !== '' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <span>✨</span>
                        <span className="text-sm font-medium">
                          Nueva categoría: "{form.category}"
                        </span>
                      </div>
                      <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>💡</span>
                        <span>Esta categoría se creará automáticamente y estará disponible para futuros productos</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Confirmación de categoría existente */}
                  {form.category && categorias.includes(form.category) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <span>✅</span>
                        <span className="text-sm font-medium">Categoría existente: "{form.category}"</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Precio
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>

                {/* Campo de Stock - Solo visible al CREAR producto */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: '#697487' }}>
                    💡 Para modificar stock después de crear el producto, usa la función "Reabastecer"
                  </p>
                </div>

                {userRole === "admin" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Tienda *
                    </label>
                    <select
                      value={tiendaSeleccionada}
                      onChange={(e) => setTiendaSeleccionada(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      required
                    >
                      <option value="">-- Selecciona tienda --</option>
                      {tiendas.map((t) => (
                        <option key={t._id} value={t._id}>
                          🏪 {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando}
                >
                  {cargando ? "Creando..." : "Crear Producto"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Filtrar por categoría
                </label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      📂 {cat}
                    </option>
                  ))}
                </select>
              </div>

              {userRole === "admin" && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Filtrar por tienda
                  </label>
                  <select
                    value={filtroTienda}
                    onChange={(e) => setFiltroTienda(e.target.value)}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="">Todas las tiendas</option>
                    {tiendas.map((t) => (
                      <option key={t._id} value={t._id}>
                        🏪 {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                    {filteredProducts.length}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Resultados
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Buscar productos
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, SKU o categoría..."
                  className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                />
                <div className="absolute left-3 top-3.5">
                  <svg className="w-5 h-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
              <p style={{ color: '#697487' }}>Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                No hay productos
              </h3>
              <p style={{ color: '#697487' }}>
                {search || filtroCategoria || filtroTienda
                  ? "No se encontraron resultados para los filtros aplicados"
                  : "Comienza agregando tu primer producto al inventario"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-4 sm:p-6">
              {filteredProducts.map((product, index) => {
                const stockStatus = getStockStatus(product.stock);
                
                return (
                  <div 
                    key={product._id} 
                    className={`border rounded-xl p-4 sm:p-6 transition-all duration-200 hover:shadow-md ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Información del producto */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#23334e' }}>
                            📦
                          </div>
                          <div>
                            <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                              {product.name}
                            </h3>
                            <p className="text-sm" style={{ color: '#697487' }}>
                              SKU: {product.sku} • ID: #{product._id.slice(-8)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                            <div className="text-sm font-medium" style={{ color: '#697487' }}>
                              Precio
                            </div>
                            <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                            <div className="text-sm font-medium" style={{ color: '#697487' }}>
                              Stock
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold" style={{ color: stockStatus.color }}>
                                {product.stock}
                              </span>
                              <span>{stockStatus.icon}</span>
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                            <div className="text-sm font-medium" style={{ color: '#697487' }}>
                              Categoría
                            </div>
                            <div className="font-bold" style={{ color: '#23334e' }}>
                              📂 {product.category}
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                            <div className="text-sm font-medium" style={{ color: '#697487' }}>
                              Tienda
                            </div>
                            <div className="font-bold" style={{ color: '#23334e' }}>
                              🏪 {product.tienda?.nombre || "Sin asignar"}
                            </div>
                          </div>
                        </div>

                        {/* Valor total del inventario */}
                        <div className="mt-3 p-3 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                          <div className="text-sm text-blue-800">
                            💰 Valor total en stock: <span className="font-bold">{formatCurrency(product.price * product.stock)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => {
                              setProductoSeleccionado(product);
                              setMostrarReabastecimiento(true);
                            }}
                            className="px-4 sm:px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md text-sm sm:text-base"
                            style={{ backgroundColor: '#10b981' }}
                            disabled={cargando}
                          >
                            📦 Reabastecer
                          </button>
                        
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-4 sm:px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md text-sm sm:text-base"
                            style={{ backgroundColor: '#46546b' }}
                            disabled={cargando}
                          >
                            ✏️ Editar
                          </button>
                        
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-md hover:bg-red-600"
                          disabled={cargando}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}