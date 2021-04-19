const express = require( 'express' );
const router = express.Router();

const { signup, login, protect, restrictTo } = require('../controllers/authController');
const { getAllUsers, getUser, updateUser, deleteUser } = require('../controllers/usersController');

router.post('/signup', signup);
router.post('/login', login);

router.get('/', protect, restrictTo('admin'), getAllUsers);
router.get('/:id', protect, restrictTo('admin'), getUser);
router.put('/:id', protect, restrictTo('admin'), updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;