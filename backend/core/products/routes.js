const express = require('express');
const router = express.Router();
const productsController = require('../../controllers/core/productsController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

router.get('/categories-with-count', verifyToken, productsController.getCategoriesWithCount);

router.get('/next-sku', verifyToken, productsController.getNextSKU);

router.get('/', verifyToken, productsController.getAll);

router.get('/categories', verifyToken, productsController.getCategories);

router.get('/categories/search', verifyToken, productsController.searchCategories);

router.get('/low-stock', verifyToken, productsController.getLowStock);

router.get('/search', verifyToken, productsController.search);

router.post('/', verifyToken, requireAdmin, productsController.create);

router.post('/:id/restock', verifyToken, requireAdmin, productsController.restock);

router.put('/:id', verifyToken, requireAdmin, productsController.update);

router.get('/:id', verifyToken, productsController.getById);
router.get('/:id/debug', verifyToken, productsController.getDebug);

router.delete('/:id', verifyToken, requireAdmin, productsController.delete);

module.exports = router;