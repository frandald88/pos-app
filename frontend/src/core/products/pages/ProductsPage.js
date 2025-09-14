import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";
import { useProductState } from '../hooks/useProductState';
import { useProductActions } from '../hooks/useProductActions';
import { productService } from '../services/productService';

export default function ProductsPage() {
  const state = useProductState();
  const [modalError, setModalError] = useState("");
  const {
    products,
    form,
    setForm,
    editingId,
    setEditingId,
    msg,
    setMsg,
    search,
    setSearch,
    tiendas,
    tiendaSeleccionada,
    setTiendaSeleccionada,
    userRole,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    setCargando,
    filtroCategoria,
    setFiltroCategoria,
    filtroTienda,
    setFiltroTienda,
    skuAutogenerado,
    usarSkuManual,
    setUsarSkuManual,
    categorias,
    mostrarReabastecimiento,
    setMostrarReabastecimiento,
    productoSeleccionado,
    setProductoSeleccionado,
    cantidadRestock,
    setCantidadRestock,
    busquedaRestock,
    setBusquedaRestock,
    productosEncontrados,
    mostrarProductosBajoStock,
    setMostrarProductosBajoStock,
    productosBajoStock,
    mostrarTodasCategorias,
    setMostrarTodasCategorias,
    categoriasFiltradas,
    setCategoriasFiltradas,
    stockActualizado
  } = state;
  
  const token = localStorage.getItem("token");
  const actions = useProductActions(state);

  const {
    filtrarCategorias,
    handleReabastecimiento,
    limpiarFormularioCompleto,
    verificarCambioStock,
    fetchProducts,
    fetchCategorias,
    buscarProductos
  } = actions;

  useEffect(() => {
    const handleClickOutside = () => {
      setCategoriasFiltradas([]);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mostrarFormulario) {
      setCategoriasFiltradas([]);
      setMostrarTodasCategorias(false);
    }
  }, [mostrarFormulario, setCategoriasFiltradas, setMostrarTodasCategorias]);

const handleSubmit = (e) => {
  e.preventDefault();
  
  // Limpiar error del modal al intentar enviar
  setModalError("");

  if (!form.name || !form.category) {
    setModalError("Por favor completa todos los campos requeridos ❌");
    return;
  }

  if (userRole === "admin" && !tiendaSeleccionada) {
    setModalError("Selecciona una tienda ❌");
    return;
  }

  setCargando(true);

  const payload = editingId 
    ? {
        name: form.name,
        sku: form.sku,
        price: form.price === "" ? 0 : parseFloat(form.price),
        category: form.category,
        ...(userRole === "admin" && { tienda: tiendaSeleccionada }),
      }
    : {
        name: form.name,
        sku: form.sku,
        price: form.price === "" ? 0 : parseFloat(form.price),
        stock: form.stock === "" ? 0 : parseInt(form.stock),
        category: form.category,
        ...(userRole === "admin" && { tienda: tiendaSeleccionada }),
      };

  console.log('🔍 Payload enviado:', payload);

  const apiCall = editingId 
    ? productService.updateProduct(token, editingId, payload)
    : productService.createProduct(token, payload);

  apiCall
    .then((response) => {
      setMsg(editingId ? "Producto actualizado exitosamente ✅" : "Producto creado exitosamente ✅");
      setModalError(""); // Limpiar error del modal en caso de éxito
      limpiarFormularioCompleto();
      fetchProducts();
      fetchCategorias();
      setTimeout(() => setMsg(""), 3000);
    })
    .catch((err) => {
      console.error('❌ Error al guardar producto:', err);
      
      // Manejar errores específicos del backend
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        
        // Error de SKU duplicado o otros errores de validación
        if (err.response.status === 400 && errorData.message) {
          let errorMessage = `❌ ${errorData.message}`;
          
          // Si hay un SKU sugerido, mostrarlo también
          if (errorData.data && errorData.data.suggestedSKU) {
            errorMessage += ` | SKU sugerido: ${errorData.data.suggestedSKU}`;
          }
          
          setModalError(errorMessage);
        } else if (errorData.message) {
          setModalError(`❌ ${errorData.message}`);
        } else {
          setModalError("Error al guardar producto ❌");
        }
      } else {
        setModalError("Error al guardar producto ❌");
      }
      
      setCargando(false);
    });
};

  const handleEdit = (p) => {
    setModalError(""); // Limpiar cualquier error previo del modal
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
    productService.deleteProduct(token, id)
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
  setModalError(""); // Limpiar error del modal
  limpiarFormularioCompleto();
};

  const handleCancelarReabastecimiento = () => {
    setMostrarReabastecimiento(false);
    setProductoSeleccionado(null);
    setCantidadRestock("");
    setBusquedaRestock("");
    state.setProductosEncontrados([]);
  };


  // Filtrar productos
  const filteredProducts = (products || []).filter((p) => {
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
    const productArray = products || [];
    return {
      total: productArray.length,
      sinStock: productArray.filter(p => p.stock === 0).length,
      bajoStock: productArray.filter(p => p.stock > 0 && p.stock <= 10).length,
      valorTotal: productArray.reduce((sum, p) => sum + (p.price * p.stock), 0)
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
                      setModalError(""); // Limpiar error del modal al cancelar
                      limpiarFormularioCompleto();
                    } else {
                      setModalError(""); // Limpiar error del modal al abrir
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
              <div className="space-y-4 sm:space-y-6">
                {/* Búsqueda de producto */}
                <div>
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
                            state.setProductosEncontrados([]);
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
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
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