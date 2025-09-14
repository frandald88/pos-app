import { useState } from 'react';

export const useProductState = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
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
  
  // Estados para SKU autogenerado
  const [skuAutogenerado, setSkuAutogenerado] = useState("");
  const [usarSkuManual, setUsarSkuManual] = useState(false);

  // Estados para las mejoras de reabastecimiento
  const [categorias, setCategorias] = useState([]);
  const [mostrarReabastecimiento, setMostrarReabastecimiento] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadRestock, setCantidadRestock] = useState("");
  const [busquedaRestock, setBusquedaRestock] = useState("");
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [mostrarProductosBajoStock, setMostrarProductosBajoStock] = useState(false);
  const [productosBajoStock, setProductosBajoStock] = useState([]);
  const [mostrarTodasCategorias, setMostrarTodasCategorias] = useState(false);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [stockActualizado, setStockActualizado] = useState(false);

  return {
    // Estados principales
    products,
    setProducts,
    form,
    setForm,
    editingId,
    setEditingId,
    msg,
    setMsg,
    search,
    setSearch,
    tiendas,
    setTiendas,
    tiendaSeleccionada,
    setTiendaSeleccionada,
    userRole,
    setUserRole,
    mostrarFormulario,
    setMostrarFormulario,
    cargando,
    setCargando,
    filtroCategoria,
    setFiltroCategoria,
    filtroTienda,
    setFiltroTienda,

    // Estados SKU
    skuAutogenerado,
    setSkuAutogenerado,
    usarSkuManual,
    setUsarSkuManual,

    // Estados reabastecimiento
    categorias,
    setCategorias,
    mostrarReabastecimiento,
    setMostrarReabastecimiento,
    productoSeleccionado,
    setProductoSeleccionado,
    cantidadRestock,
    setCantidadRestock,
    busquedaRestock,
    setBusquedaRestock,
    productosEncontrados,
    setProductosEncontrados,
    mostrarProductosBajoStock,
    setMostrarProductosBajoStock,
    productosBajoStock,
    setProductosBajoStock,
    mostrarTodasCategorias,
    setMostrarTodasCategorias,
    categoriasFiltradas,
    setCategoriasFiltradas,
    stockActualizado,
    setStockActualizado
  };
};