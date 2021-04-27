const express = require( 'express' );
const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');
const { createPurchase, getAllPurchases, getPurchase, updatePurchase, deletePurchase } = require('../controllers/purchasesController');

router.post('/', protect, createPurchase);
router.get('/', protect, getAllPurchases);
router.get('/:id', protect, getPurchase);
router.put('/:id', protect, updatePurchase);
router.delete('/:id', protect, restrictTo('admin'), deletePurchase);

module.exports = router;