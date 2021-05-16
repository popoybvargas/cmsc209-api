const express = require('express');
const router = express.Router();

const users = require('./usersRouter');
const categories = require('./categoriesRouter');
const suppliers = require('./suppliersRouter');
const items = require('./itemsRouter');
const purchases = require('./purchasesRouter');
const consumptions = require('./consumptionsRouter');
const writeoffs = require('./writeoffsRouter');

router.use('/users', users);
router.use('/categories', categories);
router.use('/suppliers', suppliers);
router.use('/items', items);
router.use('/purchases', purchases);
router.use('/consumptions', consumptions);
router.use('/writeoffs', writeoffs);

module.exports = router;