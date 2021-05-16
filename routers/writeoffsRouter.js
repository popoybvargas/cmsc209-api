const express = require('express');
const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');
const { createWriteoff, getAllWriteoffs, getWriteoff, updateWriteoff, deleteWriteoff } = require('../controllers/writeoffsController');

router.post('/', protect, createWriteoff);
router.get('/', protect, getAllWriteoffs);
router.get('/:id', protect, getWriteoff);
router.put('/:id', protect, updateWriteoff);
router.delete('/:id', protect, restrictTo('admin'), deleteWriteoff);

module.exports = router;