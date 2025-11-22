const express = require('express');
const router = express.Router();
const productsController = require('../../controllers/core/productsController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { checkResourceLimit, incrementResourceCount, decrementResourceCount } = require('../../shared/middleware/limitMiddleware');

router.get('/categories-with-count', verifyToken, identifyTenant, requireTenant, productsController.getCategoriesWithCount);

router.get('/next-sku', verifyToken, identifyTenant, requireTenant, productsController.getNextSKU);

router.get('/', verifyToken, identifyTenant, requireTenant, productsController.getAll);

router.get('/categories', verifyToken, identifyTenant, requireTenant, productsController.getCategories);

router.get('/categories/search', verifyToken, identifyTenant, requireTenant, productsController.searchCategories);

router.get('/low-stock', verifyToken, identifyTenant, requireTenant, productsController.getLowStock);

router.get('/search', verifyToken, identifyTenant, requireTenant, productsController.search);

router.post('/',
  verifyToken,
  identifyTenant,
  requireTenant,
  requireAdmin,
  checkResourceLimit('products'),
  productsController.create,
  incrementResourceCount('products')
);

router.post('/:id/restock', verifyToken, identifyTenant, requireTenant, requireAdmin, productsController.restock);

router.put('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, productsController.update);

router.get('/:id', verifyToken, identifyTenant, requireTenant, productsController.getById);
router.get('/:id/debug', verifyToken, identifyTenant, requireTenant, productsController.getDebug);

router.delete('/:id',
  verifyToken,
  identifyTenant,
  requireTenant,
  requireAdmin,
  productsController.delete,
  decrementResourceCount('products')
);

module.exports = router;