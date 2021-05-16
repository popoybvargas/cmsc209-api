const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');
const { createItem, getAllItems, getItem, updateItem, deleteItem } = require('../controllers/itemsController');

router.post('/', protect, createItem);
router.get('/', protect, getAllItems);
router.get('/:id', protect, getItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, restrictTo('admin'), deleteItem);

module.exports = router;