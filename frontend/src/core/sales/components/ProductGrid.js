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
              onClick={() => setActiveCategory('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === '' 
                  ? 'text-white shadow-md' 
                  : 'border border-gray-300'
              }`}
              style={activeCategory === '' 
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
                    ? 'text-white shadow-md' 
                    : 'border border-gray-300'
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

      {/* Grid de productos */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => onAddToCart(product)}
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
  );
};

export default ProductGrid;