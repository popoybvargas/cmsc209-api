const express = require( 'express' );
const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');
const { createConsumption, getAllConsumptions, getConsumption, updateConsumption, deleteConsumption } = require('../controllers/consumptionsController');

router.post('/', protect, createConsumption);
router.get('/', protect, getAllConsumptions);
router.get('/:id', protect, getConsumption);
router.put('/:id', protect, updateConsumption);
router.delete('/:id', protect, restrictTo('admin'), deleteConsumption);

module.exports = router;