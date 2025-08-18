const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('./model');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

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

// ✅ FUNCIÓN CORREGIDA para generar SKU automático
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

router.get('/categories-with-count', verifyToken, async (req, res) => {
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
    
    res.json(categoriesWithCount);
  } catch (err) {
    console.error('Error al obtener categorías con conteo:', err);
    // Fallback al endpoint original
    try {
      const categories = await Product.distinct('category', { 
        category: { $ne: null, $ne: '' },
        ...(req.query.tiendaId && { tienda: req.query.tiendaId })
      });
      res.json(categories.sort());
    } catch (fallbackErr) {
      res.status(500).json({ 
        message: 'Error al obtener categorías', 
        error: fallbackErr.message 
      });
    }
  }
});

// ✅ NUEVO ENDPOINT - Obtener siguiente SKU disponible
router.get('/next-sku', verifyToken, async (req, res) => {
  try {
    const nextSKU = await generateNextSKU();
    res.json({ nextSKU });
  } catch (err) {
    res.status(500).json({ message: 'Error al generar SKU', error: err.message });
  }
});

// GET - Obtener todos los productos con tienda poblada
router.get('/', verifyToken, async (req, res) => {
  try {
    const { tiendaId } = req.query;
    const filter = {};
     
    if (tiendaId) {
      filter.tienda = tiendaId;
    }
     
    const products = await Product.find(filter).populate('tienda', 'nombre');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
});

// ✅ NUEVO - Obtener categorías únicas
router.get('/categories', verifyToken, async (req, res) => {
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
    
    res.json(sortedCategories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error al obtener categorías', 
      error: err.message 
    });
  }
});

router.get('/categories/search', verifyToken, async (req, res) => {
  try {
    const { q, tiendaId, limit = 8 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
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
    res.json(categories);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error al buscar categorías', 
      error: err.message 
    });
  }
});

// ✅ NUEVO - Obtener productos con stock bajo para reabastecimiento
router.get('/low-stock', verifyToken, async (req, res) => {
  try {
    const { tiendaId, limit = 10 } = req.query;
    const filter = {
      stock: { $lte: 10 } // Stock menor o igual a 10
    };
     
    if (tiendaId) {
      filter.tienda = tiendaId;
    }
     
    const lowStockProducts = await Product.find(filter)
      .populate('tienda', 'nombre')
      .sort({ stock: 1 }) // Ordenar por stock ascendente (menor primero)
      .limit(parseInt(limit));
      
    res.json(lowStockProducts);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos con stock bajo', error: err.message });
  }
});

// ✅ NUEVO - Buscar productos para reabastecimiento
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { q, tiendaId } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    const filter = {
      $or: [
        { name: { $regex: q.trim(), $options: 'i' } },
        { sku: { $regex: q.trim(), $options: 'i' } },
        { category: { $regex: q.trim(), $options: 'i' } }
      ]
    };
    
    if (tiendaId) {
      filter.tienda = tiendaId;
    }
    
    const products = await Product.find(filter)
      .populate('tienda', 'nombre')
      .limit(20)
      .sort({ name: 1 });
      
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al buscar productos', error: err.message });
  }
});

// ✅ MODIFICADO - Crear producto con SKU autogenerado
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, sku, price, stock, category, tienda } = req.body;
     
    // Validar que la tienda venga en el payload
    if (!tienda) {
      return res.status(400).json({ message: 'La tienda es requerida para crear el producto' });
    }
     
    // Validar que el ID de tienda sea válido
    if (!mongoose.Types.ObjectId.isValid(tienda)) {
      return res.status(400).json({ message: 'ID de tienda no válido' });
    }

    // ✅ NUEVA LÓGICA: Normalizar y validar categoría
    const normalizedCategory = normalizeCategory(category);
    if (!normalizedCategory) {
      return res.status(400).json({ message: 'La categoría es requerida' });
    }

    // ✅ NUEVA LÓGICA: Generar SKU automáticamente si no se proporciona o está vacío
    let finalSKU = sku;
    if (!sku || sku.trim() === '') {
      finalSKU = await generateNextSKU();
      console.log(`SKU autogenerado: ${finalSKU}`);
    } else {
      // Verificar que el SKU manual no esté duplicado
      const existingProduct = await Product.findOne({ sku: sku.trim() });
      if (existingProduct) {
        return res.status(400).json({ 
          message: `El SKU "${sku}" ya existe. SKU sugerido: ${await generateNextSKU()}`,
          suggestedSKU: await generateNextSKU()
        });
      }
      finalSKU = sku.trim();
    }
     
    const newProduct = new Product({
      name,
      sku: finalSKU,
      price,
      stock,
      category: normalizedCategory, // ✅ Usar categoría normalizada
      tienda,
    });
     
    await newProduct.save();
     
    // Devolver el producto con la tienda ya poblada
    const populatedProduct = await Product.findById(newProduct._id).populate('tienda', 'nombre');
     
    res.status(201).json({ 
      message: `Producto creado con SKU: ${finalSKU}${category !== normalizedCategory ? ` y categoría: "${normalizedCategory}"` : ''}`, 
      product: populatedProduct,
      autoGeneratedSKU: !sku || sku.trim() === '',
      originalCategory: category,
      normalizedCategory: normalizedCategory
    });
  } catch (err) {
    console.error('Error en POST /products:', err);
    
    // Manejar error de SKU duplicado
    if (err.code === 11000 && err.keyPattern?.sku) {
      const suggestedSKU = await generateNextSKU();
      return res.status(400).json({ 
        message: `SKU duplicado. SKU sugerido: ${suggestedSKU}`,
        suggestedSKU: suggestedSKU
      });
    }
    
    res.status(400).json({ message: 'Error al crear producto', error: err.message });
  }
});

// ✅ NUEVO - Reabastecer stock de producto existente
router.post('/:id/restock', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { quantity, price } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
    }
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Actualizar stock
    const oldStock = product.stock;
    product.stock += parseInt(quantity);
    
    // Actualizar precio si se proporciona
    if (price && price > 0) {
      product.price = parseFloat(price);
    }
    
    await product.save();
    
    // ✅ IMPORTANTE: Devolver producto actualizado con tienda poblada
    const updatedProduct = await Product.findById(product._id).populate('tienda', 'nombre');
    
    res.json({ 
      message: `Stock actualizado de ${oldStock} a ${updatedProduct.stock} (+${quantity} unidades)`,
      product: updatedProduct,  // ✅ Devolver producto completo actualizado
      oldStock: oldStock,
      newStock: updatedProduct.stock,
      addedQuantity: quantity
    });
  } catch (err) {
    console.error('Error en POST /products/:id/restock:', err);
    res.status(400).json({ message: 'Error al reabastecer producto', error: err.message });
  }
});

// ✅ MODIFICADO - Actualizar producto (manejar cambios de SKU)
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { tienda, sku, category } = req.body;
     
    // Validar tienda si viene en el body
    if (tienda && !mongoose.Types.ObjectId.isValid(tienda)) {
      return res.status(400).json({ message: 'ID de tienda no válido' });
    }

    // ✅ IMPORTANTE: No permitir actualización de stock en PUT
    const updateData = { ...req.body };
    delete updateData.stock; // ❌ Eliminar stock del payload de actualización
    
    // ✅ Normalizar categoría si se proporciona
    if (category) {
      const normalizedCategory = normalizeCategory(category);
      if (!normalizedCategory) {
        return res.status(400).json({ message: 'La categoría no puede estar vacía' });
      }
      updateData.category = normalizedCategory;
    }

    // ✅ Verificar SKU duplicado en actualización
    if (sku && sku.trim() !== '') {
      const existingProduct = await Product.findOne({ 
        sku: sku.trim(), 
        _id: { $ne: req.params.id } 
      });
      
      if (existingProduct) {
        const suggestedSKU = await generateNextSKU();
        return res.status(400).json({ 
          message: `El SKU "${sku}" ya está en uso. SKU sugerido: ${suggestedSKU}`,
          suggestedSKU: suggestedSKU
        });
      }
    }
     
    await Product.findByIdAndUpdate(req.params.id, updateData);
     
    const updatedProduct = await Product.findById(req.params.id).populate('tienda', 'nombre');
    res.json({ 
      message: 'Producto actualizado (stock se maneja con reabastecimiento)', 
      product: updatedProduct,
      originalCategory: req.body.category,
      normalizedCategory: updateData.category
    });
  } catch (err) {
    console.error('Error en PUT /products:', err);
    res.status(400).json({ message: 'Error al actualizar producto', error: err.message });
  }
});

router.get('/:id/debug', verifyToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('tienda', 'nombre');
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({
      product: product,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener producto', error: err.message });
  }
});

// DELETE - Eliminar producto (solo admin)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error en DELETE /products:', err);
    res.status(400).json({ message: 'Error al eliminar producto', error: err.message });
  }
});

module.exports = router;