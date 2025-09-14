const Product = require('../../core/products/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

const normalizeCategory = (category) => {
  if (!category || typeof category !== 'string') return '';
  
  return category
    .trim()                           // Eliminar espacios al inicio y final
    .toLowerCase()                    // Convertir a minúsculas
    .split(' ')                      // Dividir por espacios
    .filter(word => word.length > 0) // Eliminar palabras vacías
    .map(word => 
      word.charAt(0).toUpperCase() + word.slice(1) // Capitalizar primera letra
    )
    .join(' ');                      // Unir con espacios
};

const generateNextSKU = async () => {
  try {
    // Buscar todos los productos con SKU numérico
    const products = await Product.find({
      sku: { $regex: /^\d+$/ } // Solo SKUs que sean completamente numéricos
    })
    .select('sku')
    .lean();

    if (!products || products.length === 0) {
      return "1"; // Si no hay productos, empezar desde 1
    }

    // Convertir todos los SKUs a números y encontrar el máximo
    const numericSKUs = products.map(p => parseInt(p.sku)).filter(num => !isNaN(num));
    
    if (numericSKUs.length === 0) {
      return "1"; // Si no hay SKUs numéricos válidos, empezar desde 1
    }

    const maxSKU = Math.max(...numericSKUs);
    const nextSKU = maxSKU + 1;
    
    console.log(`SKUs encontrados: [${numericSKUs.join(', ')}], máximo: ${maxSKU}, siguiente: ${nextSKU}`);
    
    return nextSKU.toString();
  } catch (error) {
    console.error('Error generando SKU:', error);
    // Fallback: usar timestamp como SKU único
    return Date.now().toString();
  }
};

class ProductsController {

  // Obtener todos los productos
  async getAll(req, res) {
    try {
      const { 
        tiendaId, 
        category, 
        search, 
        inStock, 
        limit = 50, 
        page = 1,
        sortBy = 'createdAt',
        sortOrder = 'asc'
      } = req.query;

      // Construir filtros
      const filter = {};
      
      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }
      
      if (category) {
        filter.category = { $regex: category, $options: 'i' };
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (inStock === 'true') {
        filter.stock = { $gt: 0 };
      } else if (inStock === 'false') {
        filter.stock = { $lte: 0 };
      }

      // Configurar paginación
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Configurar ordenamiento
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const products = await Product.find(filter)
        .populate('tienda', 'nombre')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(filter);

      // Estadísticas adicionales
      const stats = await Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
            lowStock: { $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] } },
            outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
          }
        }
      ]);

      return successResponse(res, {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: stats[0] || {
          totalProducts: 0,
          totalValue: 0,
          lowStock: 0,
          outOfStock: 0
        }
      }, 'Productos obtenidos exitosamente');

    } catch (error) {
      console.error('Error obteniendo productos:', error);
      return errorResponse(res, 'Error al obtener productos', 500);
    }
  }

  // Obtener producto por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de producto inválido', 400);
      }

      const product = await Product.findById(id).populate('tienda', 'nombre');

      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }

      return successResponse(res, product, 'Producto obtenido exitosamente');

    } catch (error) {
      console.error('Error obteniendo producto:', error);
      return errorResponse(res, 'Error al obtener producto', 500);
    }
  }

  // Crear nuevo producto
  async create(req, res) {
    try {
      const { name, sku, price, stock, category, tienda } = req.body;
       
      // Validar que la tienda venga en el payload
      if (!tienda) {
        return errorResponse(res, 'La tienda es requerida para crear el producto', 400);
      }
       
      // Validar que el ID de tienda sea válido
      if (!mongoose.Types.ObjectId.isValid(tienda)) {
        return errorResponse(res, 'ID de tienda no válido', 400);
      }

      // Normalizar y validar categoría
      const normalizedCategory = normalizeCategory(category);
      if (!normalizedCategory) {
        return errorResponse(res, 'La categoría es requerida', 400);
      }

      // Generar SKU automáticamente si no se proporciona o está vacío
      let finalSKU = sku;
      if (!sku || sku.trim() === '') {
        finalSKU = await generateNextSKU();
        console.log(`SKU autogenerado: ${finalSKU}`);
      } else {
        // Verificar que el SKU manual no esté duplicado
        const existingProduct = await Product.findOne({ sku: sku.trim() });
        if (existingProduct) {
          const suggestedSKU = await generateNextSKU();
          return errorResponse(res, `El SKU "${sku}" ya existe. SKU sugerido: ${suggestedSKU}`, 400, { suggestedSKU });
        }
        finalSKU = sku.trim();
      }
       
      const newProduct = new Product({
        name,
        sku: finalSKU,
        price,
        stock,
        category: normalizedCategory,
        tienda,
      });
       
      await newProduct.save();
       
      // Devolver el producto con la tienda ya poblada
      const populatedProduct = await Product.findById(newProduct._id).populate('tienda', 'nombre');
       
      return successResponse(res, {
        product: populatedProduct,
        autoGeneratedSKU: !sku || sku.trim() === '',
        originalCategory: category,
        normalizedCategory: normalizedCategory
      }, `Producto creado con SKU: ${finalSKU}${category !== normalizedCategory ? ` y categoría: "${normalizedCategory}"` : ''}`, 201);
    } catch (err) {
      console.error('Error en POST /products:', err);
      
      // Manejar error de SKU duplicado
      if (err.code === 11000 && err.keyPattern?.sku) {
        const suggestedSKU = await generateNextSKU();
        return errorResponse(res, `SKU duplicado. SKU sugerido: ${suggestedSKU}`, 400, { suggestedSKU });
      }
      
      return errorResponse(res, 'Error al crear producto', 500);
    }
  }

  // Actualizar producto
  async update(req, res) {
    try {
      const { tienda, sku, category } = req.body;
       
      // Validar tienda si viene en el body
      if (tienda && !mongoose.Types.ObjectId.isValid(tienda)) {
        return errorResponse(res, 'ID de tienda no válido', 400);
      }

      // No permitir actualización de stock en PUT
      const updateData = { ...req.body };
      delete updateData.stock; // Eliminar stock del payload de actualización
      
      // Normalizar categoría si se proporciona
      if (category) {
        const normalizedCategory = normalizeCategory(category);
        if (!normalizedCategory) {
          return errorResponse(res, 'La categoría no puede estar vacía', 400);
        }
        updateData.category = normalizedCategory;
      }

      // Verificar SKU duplicado en actualización
      if (sku && sku.trim() !== '') {
        const existingProduct = await Product.findOne({ 
          sku: sku.trim(), 
          _id: { $ne: req.params.id } 
        });
        
        if (existingProduct) {
          const suggestedSKU = await generateNextSKU();
          return errorResponse(res, `El SKU "${sku}" ya está en uso. SKU sugerido: ${suggestedSKU}`, 400, { suggestedSKU });
        }
      }
       
      await Product.findByIdAndUpdate(req.params.id, updateData);
       
      const updatedProduct = await Product.findById(req.params.id).populate('tienda', 'nombre');
      return successResponse(res, {
        product: updatedProduct,
        originalCategory: req.body.category,
        normalizedCategory: updateData.category
      }, 'Producto actualizado (stock se maneja con reabastecimiento)');
    } catch (err) {
      console.error('Error en PUT /products:', err);
      return errorResponse(res, 'Error al actualizar producto', 500);
    }
  }

  // Eliminar producto
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de producto inválido', 400);
      }

      const product = await Product.findById(id);
      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }

      await Product.findByIdAndDelete(id);

      return successResponse(res, {}, 'Producto eliminado exitosamente');

    } catch (error) {
      console.error('Error eliminando producto:', error);
      return errorResponse(res, 'Error al eliminar producto', 500);
    }
  }

  // Reabastecer stock de producto existente
  async restock(req, res) {
    try {
      const { quantity, price } = req.body;
      
      if (!quantity || quantity <= 0) {
        return errorResponse(res, 'La cantidad debe ser mayor a 0', 400);
      }
      
      const product = await Product.findById(req.params.id);
      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }
      
      // Actualizar stock
      const oldStock = product.stock;
      product.stock += parseInt(quantity);
      
      // Actualizar precio si se proporciona
      if (price && price > 0) {
        product.price = parseFloat(price);
      }
      
      await product.save();
      
      // Devolver producto actualizado con tienda poblada
      const updatedProduct = await Product.findById(product._id).populate('tienda', 'nombre');
      
      return successResponse(res, {
        product: updatedProduct,
        oldStock: oldStock,
        newStock: updatedProduct.stock,
        addedQuantity: quantity
      }, `Stock actualizado de ${oldStock} a ${updatedProduct.stock} (+${quantity} unidades)`);
    } catch (err) {
      console.error('Error en POST /products/:id/restock:', err);
      return errorResponse(res, 'Error al reabastecer producto', 500);
    }
  }

  // Debug producto
  async getDebug(req, res) {
    try {
      const product = await Product.findById(req.params.id).populate('tienda', 'nombre');
      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }
      return successResponse(res, {
        product: product,
        timestamp: new Date().toISOString()
      }, 'Debug de producto obtenido exitosamente');
    } catch (err) {
      return errorResponse(res, 'Error al obtener producto', 500);
    }
  }

  // Obtener productos con stock bajo
  async getLowStock(req, res) {
    try {
      const { threshold = 10, tiendaId } = req.query;
      
      const filter = { stock: { $lte: parseInt(threshold) } };
      
      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      const products = await Product.find(filter)
        .populate('tienda', 'nombre')
        .sort({ stock: 1 });

      return successResponse(res, products, 'Productos con stock bajo obtenidos exitosamente');

    } catch (error) {
      console.error('Error obteniendo productos con stock bajo:', error);
      return errorResponse(res, 'Error al obtener productos con stock bajo', 500);
    }
  }

  // Obtener categorías con conteo
  async getCategoriesWithCount(req, res) {
    try {
      const { tiendaId } = req.query;
      const matchFilter = { 
        category: { $ne: null, $ne: '' } 
      };
      
      // Filtrar por tienda si se proporciona
      if (tiendaId) {
        matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
      }
      
      // Agregación para contar productos por categoría
      const categoriesWithCount = await Product.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalStock: { $sum: '$stock' },
            avgPrice: { $avg: '$price' }
          }
        },
        { $sort: { count: -1 } }, // Ordenar por uso descendente
        { $limit: 50 } // Límite de 50 categorías más usadas
      ]);
      
      return successResponse(res, categoriesWithCount, 'Categorías con conteo obtenidas exitosamente');
    } catch (err) {
      console.error('Error al obtener categorías con conteo:', err);
      // Fallback al endpoint original
      try {
        const categories = await Product.distinct('category', { 
          category: { $ne: null, $ne: '' },
          ...(req.query.tiendaId && { tienda: req.query.tiendaId })
        });
        return successResponse(res, categories.sort(), 'Categorías obtenidas exitosamente');
      } catch (fallbackErr) {
        return errorResponse(res, 'Error al obtener categorías', 500);
      }
    }
  }

  // Obtener siguiente SKU disponible
  async getNextSKU(req, res) {
    try {
      const nextSKU = await generateNextSKU();
      return successResponse(res, { nextSKU }, 'SKU generado exitosamente');
    } catch (err) {
      return errorResponse(res, 'Error al generar SKU', 500);
    }
  }

  // Obtener categorías únicas
  async getCategories(req, res) {
    try {
      const { tiendaId } = req.query;
      const filter = { 
        category: { $ne: null, $ne: '' } 
      };
      
      if (tiendaId) {
        filter.tienda = tiendaId;
      }
      
      const categories = await Product.distinct('category', filter);
      
      // Ordenar alfabéticamente y limitar a 30 para performance
      const sortedCategories = categories
        .filter(cat => cat && cat.trim() !== '') // Filtrar categorías vacías
        .sort()
        .slice(0, 30); // Límite para evitar problemas de performance
      
      return successResponse(res, sortedCategories, 'Categorías obtenidas exitosamente');
    } catch (err) {
      return errorResponse(res, 'Error al obtener categorías', 500);
    }
  }

  // Buscar categorías
  async searchCategories(req, res) {
    try {
      const { q, tiendaId, limit = 8 } = req.query;
      
      if (!q || q.trim().length < 2) {
        return successResponse(res, [], 'Búsqueda de categorías completada');
      }
      
      const filter = {
        category: { 
          $regex: q.trim(), 
          $options: 'i',
          $ne: null, 
          $ne: '' 
        }
      };
      
      if (tiendaId) {
        filter.tienda = tiendaId;
      }
      
      // Buscar categorías que coincidan y obtener su frecuencia de uso
      const matchingCategories = await Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);
      
      const categories = matchingCategories.map(item => item._id);
      return successResponse(res, categories, 'Búsqueda de categorías completada exitosamente');
    } catch (err) {
      return errorResponse(res, 'Error al buscar categorías', 500);
    }
  }

  // Buscar productos
  async search(req, res) {
    try {
      const { q, tiendaId, limit = 20 } = req.query;

      if (!q || q.trim() === '') {
        return errorResponse(res, 'Término de búsqueda requerido', 400);
      }

      const filter = {
        $or: [
          { name: { $regex: q.trim(), $options: 'i' } },
          { sku: { $regex: q.trim(), $options: 'i' } },
          { category: { $regex: q.trim(), $options: 'i' } }
        ]
      };

      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      const products = await Product.find(filter)
        .populate('tienda', 'nombre')
        .limit(parseInt(limit))
        .sort({ name: 1 });

      return successResponse(res, products, 'Búsqueda completada exitosamente');

    } catch (error) {
      console.error('Error en búsqueda de productos:', error);
      return errorResponse(res, 'Error en la búsqueda', 500);
    }
  }

  // Importar productos masivamente
  async bulkImport(req, res) {
    try {
      const { products } = req.body;

      if (!Array.isArray(products) || products.length === 0) {
        return errorResponse(res, 'Debe proporcionar un array de productos', 400);
      }

      const results = {
        success: [],
        errors: []
      };

      for (let i = 0; i < products.length; i++) {
        const productData = products[i];
        
        try {
          // Validar datos básicos
          if (!productData.name || !productData.sku || !productData.tienda) {
            results.errors.push({
              row: i + 1,
              error: 'Nombre, SKU y tienda son requeridos',
              data: productData
            });
            continue;
          }

          // Verificar si el producto ya existe
          const existingProduct = await Product.findOne({ 
            sku: productData.sku.trim().toUpperCase(), 
            tienda: productData.tienda 
          });

          if (existingProduct) {
            results.errors.push({
              row: i + 1,
              error: 'Ya existe un producto con este SKU en la tienda',
              data: productData
            });
            continue;
          }

          // Crear producto
          const newProduct = new Product({
            name: productData.name.trim(),
            sku: productData.sku.trim().toUpperCase(),
            price: parseFloat(productData.price) || 0,
            stock: parseInt(productData.stock) || 0,
            category: productData.category?.trim(),
            tienda: productData.tienda
          });

          await newProduct.save();
          results.success.push({
            row: i + 1,
            product: newProduct
          });

        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error.message,
            data: productData
          });
        }
      }

      return successResponse(res, results, `Importación completada. ${results.success.length} exitosos, ${results.errors.length} errores`);

    } catch (error) {
      console.error('Error en importación masiva:', error);
      return errorResponse(res, 'Error en la importación masiva', 500);
    }
  }
}

module.exports = new ProductsController();