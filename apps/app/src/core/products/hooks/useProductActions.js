import { useEffect } from 'react';
import { productService } from '../services/productService';

export const useProductActions = (state) => {
  const {
    setProducts,
    setTiendas,
    setUserRole,
    setCategorias,
    setProductosBajoStock,
    setSkuAutogenerado,
    setForm,
    editingId,
    usarSkuManual,
    setCargando,
    setMsg,
    setProductosEncontrados,
    setCategoriasFiltradas,
    categorias,
    setProductoSeleccionado,
    setCantidadRestock,
    setBusquedaRestock,
    setMostrarReabastecimiento,
    productoSeleccionado,
    cantidadRestock,
    setStockActualizado,
    setEditingId,
    setTiendaSeleccionada,
    setMostrarFormulario,
    setUsarSkuManual,
    setMostrarTodasCategorias,
    setCategoriasFiltradas: resetCategoriasFiltradas,
    fetchNextSKU: externalFetchNextSKU
  } = state;

  const token = localStorage.getItem("token");

  const fetchNextSKU = () => {
    if (editingId || usarSkuManual) {
      return;
    }
    
    productService.getNextSKU(token)
      .then((data) => {
        console.log('🔢 Nuevo SKU obtenido:', data.nextSKU);
        setSkuAutogenerado(data.nextSKU);
        if (!editingId && !usarSkuManual) {
          setForm(prevForm => ({ ...prevForm, sku: data.nextSKU }));
        }
      })
      .catch(() => console.error("Error al obtener SKU"));
  };

  const fetchProducts = (filters = {}) => {
    setCargando(true);

    // Log de filtros aplicados
    if (Object.keys(filters).length > 0) {
      console.log('🔍 Obteniendo productos con filtros:', filters);
    }

    productService.getAllProducts(token, filters)
      .then((data) => {
        console.log('📦 Productos obtenidos (primeros 3):', data.slice(0, 3).map(p => ({
          name: p.name,
          sku: p.sku,
          tienda: p.tienda?.nombre || 'Sin tienda',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        })));
        setProducts(data);
        setCargando(false);
      })
      .catch((error) => {
        console.error('❌ Error al obtener productos:', error);
        setMsg("Error al cargar productos ❌");
        setCargando(false);
      });
  };

  const fetchTiendas = () => {
    productService.getTiendas(token)
      .then((data) => setTiendas(data))
      .catch(() => console.error("Error al cargar tiendas"));
  };

  const fetchUserProfile = () => {
    productService.getUserProfile(token)
      .then((data) => setUserRole(data.role))
      .catch(() => console.error("Error al cargar perfil"));
  };

  const fetchCategorias = () => {
    productService.getCategoriesWithCount(token)
      .then((data) => {
        if (Array.isArray(data) && data[0]?.count !== undefined) {
          const sortedCategories = data
            .sort((a, b) => b.count - a.count)
            .map(item => item._id);
          setCategorias(sortedCategories);
        } else {
          setCategorias(data.sort());
        }
      })
      .catch((error) => {
        console.error("❌ Error al cargar categorías:", error);
        setCategorias([]);
      });
  };

  const fetchProductosBajoStock = () => {
    productService.getLowStockProducts(token, 10)
      .then((data) => {
        console.log('⚠️ Productos con stock bajo obtenidos:', data.length);
        setProductosBajoStock(data);
      })
      .catch(() => console.error("Error al cargar productos con bajo stock"));
  };

  const buscarProductos = (termino) => {
    if (termino.length < 2) {
      setProductosEncontrados([]);
      return;
    }
    
    productService.searchProducts(token, termino)
      .then((data) => {
        setProductosEncontrados(data);
      })
      .catch((error) => {
        console.error("❌ Error al buscar productos:", error);
        setProductosEncontrados([]);
      });
  };

  const filtrarCategorias = (termino) => {
    if (!termino || termino.length < 2) {
      setCategoriasFiltradas([]);
      return;
    }
    
    const filtradas = categorias.filter(cat => 
      cat.toLowerCase().includes(termino.toLowerCase())
    ).slice(0, 8);
    
    setCategoriasFiltradas(filtradas);
  };

  const handleReabastecimiento = (e) => {
    e.preventDefault();
    
    if (!productoSeleccionado || cantidadRestock === "" || parseInt(cantidadRestock) <= 0) {
      setMsg("Selecciona un producto y cantidad válida ❌");
      return;
    }

    setCargando(true);
    
    const payload = {
      quantity: parseInt(cantidadRestock)
    };

    console.log('🔍 Reabastecimiento payload:', {
      productId: productoSeleccionado._id,
      currentStock: productoSeleccionado.stock,
      addingQuantity: parseInt(cantidadRestock),
      expectedNewStock: productoSeleccionado.stock + parseInt(cantidadRestock)
    });

    productService.restockProduct(token, productoSeleccionado._id, payload)
      .then((data) => {
        console.log('✅ Reabastecimiento exitoso:', data);
        
        if (editingId && editingId === productoSeleccionado._id && data.product) {
          console.log('🔄 Actualizando formulario de edición con nuevo stock:', data.product.stock);
          setForm(prevForm => ({
            ...prevForm,
            stock: data.product.stock
          }));
          
          setStockActualizado(true);
          setTimeout(() => setStockActualizado(false), 3000);
        }
        
        setMsg(data.message + " ✅");
        setProductoSeleccionado(null);
        setCantidadRestock("");
        setBusquedaRestock("");
        setProductosEncontrados([]);
        setMostrarReabastecimiento(false);
        
        fetchProducts();
        fetchProductosBajoStock();
        
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((err) => {
        console.error('❌ Error en reabastecimiento:', err);
        setMsg(`Error al reabastecer producto: ${err.message || err} ❌`);
      })
      .finally(() => {
        setCargando(false);
      });
  };

  const limpiarFormularioCompleto = () => {
    console.log('🧹 Limpiando formulario completo...');

    setForm({
      name: "",
      sku: "",
      price: "",
      stock: "",
      category: "",
      tienda: "",
      barcode: ""
    });

    setEditingId(null);
    setTiendaSeleccionada("");
    setMostrarFormulario(false);
    setUsarSkuManual(false);
    setSkuAutogenerado("");
    resetCategoriasFiltradas([]);
    setMostrarTodasCategorias(false);
    setStockActualizado(false);

    fetchNextSKU();
  };

  const verificarCambioStock = async (productId) => {
    try {
      const data = await productService.getProductDebug(token, productId);
      console.log('📊 Stock después de reabastecimiento:', data.product.stock);
    } catch (err) {
      console.error('Error verificando stock:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTiendas();
    fetchUserProfile();
    fetchCategorias();
    fetchProductosBajoStock();
    fetchNextSKU();
  }, []);

  return {
    fetchNextSKU,
    fetchProducts,
    fetchTiendas,
    fetchUserProfile,
    fetchCategorias,
    fetchProductosBajoStock,
    buscarProductos,
    filtrarCategorias,
    handleReabastecimiento,
    limpiarFormularioCompleto,
    verificarCambioStock
  };
};