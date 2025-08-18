const Product = require('../../core/products/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

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
        sortBy = 'name',
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

      // Validaciones básicas
      if (!name || !sku || price === undefined || stock === undefined || !tienda) {
        return errorResponse(res, 'Nombre, SKU, precio, stock y tienda son requeridos', 400);
      }

      if (price < 0) {
        return errorResponse(res, 'El precio no puede ser negativo', 400);
      }

      if (stock < 0) {
        return errorResponse(res, 'El stock no puede ser negativo', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(tienda)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      // Verificar que el SKU no exista ya en la misma tienda
      const existingProduct = await Product.findOne({ sku, tienda });
      if (existingProduct) {
        return errorResponse(res, 'Ya existe un producto con este SKU en la tienda', 400);
      }

      // Crear producto
      const newProduct = new Product({
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: parseFloat(price),
        stock: parseInt(stock),
        category: category?.trim(),
        tienda
      });

      await newProduct.save();

      // Obtener producto creado con tienda poblada
      const createdProduct = await Product.findById(newProduct._id)
        .populate('tienda', 'nombre');

      return successResponse(res, createdProduct, 'Producto creado exitosamente', 201);

    } catch (error) {
      console.error('Error creando producto:', error);
      if (error.code === 11000) {
        return errorResponse(res, 'El SKU ya está en uso', 400);
      }
      return errorResponse(res, 'Error al crear producto', 500);
    }
  }

  // Actualizar producto
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, sku, price, stock, category, tienda } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de producto inválido', 400);
      }

      const product = await Product.findById(id);
      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }

      // Validaciones
      if (price !== undefined && price < 0) {
        return errorResponse(res, 'El precio no puede ser negativo', 400);
      }

      if (stock !== undefined && stock < 0) {
        return errorResponse(res, 'El stock no puede ser negativo', 400);
      }

      if (tienda && !mongoose.Types.ObjectId.isValid(tienda)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      // Si se actualiza el SKU, verificar que no exista ya
      if (sku && sku !== product.sku) {
        const existingProduct = await Product.findOne({ 
          sku: sku.trim().toUpperCase(), 
          tienda: tienda || product.tienda,
          _id: { $ne: id }
        });
        if (existingProduct) {
          return errorResponse(res, 'Ya existe un producto con este SKU en la tienda', 400);
        }
      }

      // Preparar datos de actualización
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (sku) updateData.sku = sku.trim().toUpperCase();
      if (price !== undefined) updateData.price = parseFloat(price);
      if (stock !== undefined) updateData.stock = parseInt(stock);
      if (category !== undefined) updateData.category = category?.trim();
      if (tienda) updateData.tienda = tienda;

      // Actualizar producto
      await Product.findByIdAndUpdate(id, updateData, { 
        runValidators: true,
        new: true
      });

      // Obtener producto actualizado
      const updatedProduct = await Product.findById(id)
        .populate('tienda', 'nombre');

      return successResponse(res, updatedProduct, 'Producto actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando producto:', error);
      if (error.code === 11000) {
        return errorResponse(res, 'El SKU ya está en uso', 400);
      }
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

  // Actualizar stock de producto
  async updateStock(req, res) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body; // operation: 'add', 'subtract', 'set'

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de producto inválido', 400);
      }

      if (!quantity || !operation) {
        return errorResponse(res, 'Cantidad y operación son requeridas', 400);
      }

      if (!['add', 'subtract', 'set'].includes(operation)) {
        return errorResponse(res, 'Operación inválida. Use: add, subtract, set', 400);
      }

      const product = await Product.findById(id);
      if (!product) {
        return errorResponse(res, 'Producto no encontrado', 404);
      }

      let newStock;
      
      switch (operation) {
        case 'add':
          newStock = product.stock + parseInt(quantity);
          break;
        case 'subtract':
          newStock = product.stock - parseInt(quantity);
          break;
        case 'set':
          newStock = parseInt(quantity);
          break;
      }

      if (newStock < 0) {
        return errorResponse(res, 'El stock no puede ser negativo', 400);
      }

      product.stock = newStock;
      await product.save();

      const updatedProduct = await Product.findById(id).populate('tienda', 'nombre');

      return successResponse(res, updatedProduct, 'Stock actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando stock:', error);
      return errorResponse(res, 'Error al actualizar stock', 500);
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

  // Obtener categorías únicas
  async getCategories(req, res) {
    try {
      const { tiendaId } = req.query;
      
      const filter = {};
      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      const categories = await Product.distinct('category', filter);
      const validCategories = categories.filter(cat => cat && cat.trim() !== '');

      return successResponse(res, validCategories.sort(), 'Categorías obtenidas exitosamente');

    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return errorResponse(res, 'Error al obtener categorías', 500);
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