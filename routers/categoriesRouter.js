const express = require( 'express' );
const router = express.Router();

const { protect } = require('../controllers/authController');
const { getAllCategories } = require('../controllers/categoriesController');

router.get('/', protect, getAllCategories);

module.exports = router;