import React, { useState } from 'react';

const ProductGrid = ({
  products,
  search,
  setSearch,
  onAddToCart,
  activeCategory,
  setActiveCategory
}) => {
  const [addingCustomProduct, setAddingCustomProduct] = useState(false);
  const [customProduct, setCustomProduct] = useState({ name: '', price: '' });
  const [customProductError, setCustomProductError] = useState('');

  // Función para obtener emoji/ícono según categoría del producto
  const getCategoryIcon = (category) => {
    const categoryLower = category?.toLowerCase() || '';

    // Mapeo de categorías a emojis
    const categoryIcons = {
      // Alimentos
      'bebidas': '🥤',
      'bebida': '🥤',
      'drinks': '🥤',
      'refrescos': '🥤',
      'jugos': '🧃',

      // Comida
      'comida': '🍽️',
      'food': '🍽️',
      'platillos': '🍽️',
      'alimentos': '🍱',
      'desayuno': '🍳',
      'lunch': '🍔',
      'cena': '🍲',

      // Productos específicos
      'pizza': '🍕',
      'hamburguesa': '🍔',
      'hamburguesas': '🍔',
      'tacos': '🌮',
      'tortas': '🥙',
      'sandwich': '🥪',
      'ensaladas': '🥗',
      'ensalada': '🥗',
      'pasta': '🍝',
      'sushi': '🍣',

      // Postres
      'postres': '🍰',
      'postre': '🍰',
      'dessert': '🍰',
      'helados': '🍦',
      'helado': '🍦',
      'pasteles': '🎂',
      'galletas': '🍪',

      // Panadería
      'panaderia': '🥖',
      'pan': '🍞',
      'bakery': '🥖',

      // Frutas y verduras
      'frutas': '🍎',
      'fruta': '🍎',
      'verduras': '🥬',
      'verdura': '🥬',
      'vegetales': '🥕',

      // Carnes
      'carnes': '🥩',
      'carne': '🥩',
      'meat': '🥩',
      'pollo': '🍗',
      'pescado': '🐟',
      'mariscos': '🦐',

      // Lácteos
      'lacteos': '🥛',
      'leche': '🥛',
      'queso': '🧀',
      'yogurt': '🥛',

      // Snacks
      'snacks': '🍿',
      'botanas': '🍿',
      'dulces': '🍬',
      'chocolates': '🍫',

      // Café/Té
      'cafe': '☕',
      'coffee': '☕',
      'te': '🍵',
      'tea': '🍵',

      // Alcohol
      'cervezas': '🍺',
      'cerveza': '🍺',
      'vinos': '🍷',
      'vino': '🍷',
      'licores': '🍾',

      // Otros
      'abarrotes': '🛒',
      'limpieza': '🧹',
      'higiene': '🧴',
      'farmacia': '💊',
      'medicina': '💊',
      'papeleria': '📝',
      'electronica': '📱',
      'ropa': '👕',
      'calzado': '👟',
      'juguetes': '🧸',
      'libros': '📚',
      'herramientas': '🔧',
      'jardineria': '🌱',
      'mascotas': '🐾',
      'flores': '🌸',
    };

    // Buscar coincidencia en el mapeo
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (categoryLower.includes(key)) {
        return icon;
      }
    }

    // Ícono por defecto
    return '📦';
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  // Agrupar por categoría
  const groupedByCategory = filteredProducts.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});

  const categories = Object.keys(groupedByCategory);
  const displayProducts = activeCategory 
    ? groupedByCategory[activeCategory] || []
    : filteredProducts;

  // Agregar producto personalizado
  const handleAddCustomProduct = () => {
    if (!customProduct.name || !customProduct.price) {
      setCustomProductError('Debes llenar descripción y precio ❌');
      setTimeout(() => setCustomProductError(''), 3000);
      return;
    }

    onAddToCart({
      _id: `custom-${Date.now()}`,
      name: customProduct.name,
      price: parseFloat(customProduct.price),
    });

    setCustomProduct({ name: '', price: '' });
    setAddingCustomProduct(false);
    setCustomProductError('');
  };

  const handleCancelCustomProduct = () => {
    setAddingCustomProduct(false);
    setCustomProduct({ name: '', price: '' });
    setCustomProductError('');
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl shadow-lg border border-gray-200 overflow-hidden" style={{ backgroundColor: '#f4f6fa' }}>
      {/* Barra de búsqueda y filtros */}
      <div className="px-4 py-3 border-b-2 shadow-sm" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottomColor: '#e2e8f0' }}>
        <div className="flex gap-3 items-center">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="block w-full pl-10 pr-4 py-2.5 text-sm font-medium border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent shadow-sm transition-all hover:shadow-md"
              style={{
                '--tw-ring-color': '#46546b',
                color: '#23334e',
                borderColor: '#cbd5e1',
                backgroundColor: 'white'
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Botón producto personalizado */}
          {!addingCustomProduct && (
            <button
              onClick={() => setAddingCustomProduct(true)}
              className="px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap shadow-md"
              style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
            >
              + Personalizado
            </button>
          )}
        </div>

        {/* Filtros por categoría */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${activeCategory === '' ? 'text-white' : 'border-2'}`}
            style={activeCategory === '' ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' } : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }}
          >
            📋 Todas
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${activeCategory === category ? 'text-white' : 'border-2'}`}
              style={activeCategory === category ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' } : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }}
            >
              {getCategoryIcon(category)} {category} ({groupedByCategory[category]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de producto personalizado */}
      {addingCustomProduct && (
        <div className="p-6 border-b border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>Nuevo Producto Personalizado</h3>
              <button
                onClick={handleCancelCustomProduct}
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
            {customProductError && (
              <div className="mt-3 p-3 rounded-lg text-sm font-medium text-center border border-red-200"
                   style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                {customProductError}
              </div>
            )}
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddCustomProduct}
                className="flex-1 text-white py-3 rounded-lg transition-all duration-200 font-medium"
                style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
              >
                Agregar al Carrito
              </button>
              <button
                onClick={handleCancelCustomProduct}
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

      {/* Grid de productos - Vista compacta estilo POS */}
      <div className="flex-1 p-2 overflow-y-auto" style={{ backgroundColor: '#fafbfc' }}>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1.5">
          {displayProducts.map((product) => (
            <button
              key={product._id}
              onClick={() => onAddToCart(product)}
              className="bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md cursor-pointer transition-all duration-150 active:scale-95 group relative"
              style={{
                minHeight: '110px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Indicador de producto por peso */}
              {product.soldByWeight && (
                <div
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#10b981', color: 'white' }}
                  title="Producto vendido por peso"
                >
                  ⚖
                </div>
              )}

              {/* Ícono del producto - emoji por categoría */}
              <div className="w-full aspect-square rounded-md mb-1.5 flex items-center justify-center transition-all duration-150"
                   style={{
                     background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                     maxHeight: '60px'
                   }}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-150">
                  {getCategoryIcon(product.category)}
                </span>
              </div>

              {/* Nombre del producto - compacto */}
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <h3 className="font-medium text-xs leading-tight mb-1 line-clamp-2 text-left"
                    style={{ color: '#23334e', fontSize: '0.75rem' }}>
                  {product.name}
                </h3>

                {/* Precio y unidad */}
                <div className="mt-auto">
                  <p className="text-sm font-bold" style={{ color: '#10b981' }}>
                    ${product.price}
                    {product.soldByWeight && (
                      <span className="text-xs font-normal ml-0.5" style={{ color: '#6b7280' }}>
                        /{product.weightUnit || 'kg'}
                      </span>
                    )}
                  </p>
                  {/* Badge de stock bajo (opcional) */}
                  {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && !product.soldByWeight && (
                    <span className="text-xs px-1 py-0.5 rounded mt-0.5 inline-block" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      Stock: {product.stock}
                    </span>
                  )}
                  {product.stock === 0 && !product.soldByWeight && (
                    <span className="text-xs px-1 py-0.5 rounded mt-0.5 inline-block" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                      Agotado
                    </span>
                  )}
                </div>
              </div>
            </button>
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
  );
};

export default ProductGrid;