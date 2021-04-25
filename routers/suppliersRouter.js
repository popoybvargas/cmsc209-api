const express = require( 'express' );
const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');
const { getAllSuppliers, getSupplier, updateSupplier, deleteSupplier } = require('../controllers/suppliersController');

router.get('/', protect, getAllSuppliers);
router.get('/:id', protect, getSupplier);
router.put('/:id', protect, updateSupplier);
router.delete('/:id', protect, restrictTo('admin'), deleteSupplier);

module.exports = router;