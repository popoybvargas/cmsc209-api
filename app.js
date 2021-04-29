const express = require('express');
const morgan = require('morgan');

const router = require('./routers/usersRouter');
const categoriesRouter = require('./routers/categoriesRouter');
const suppliersRouter = require('./routers/suppliersRouter');
const itemsRouter = require('./routers/itemsRouter');
const purchasesRouter = require('./routers/purchasesRouter');
const consumptionsRouter = require('./routers/consumptionsRouter');
const writeoffsRouter = require('./routers/writeoffsRouter');

const app = express();

app.use(morgan('tiny'));
app.use(express.json(), express.urlencoded({ extended: true }));

const v1 = '/api/v1';
app.use(`${v1}/users`, router);
app.use(`${v1}/categories`, categoriesRouter);
app.use(`${v1}/suppliers`, suppliersRouter);
app.use(`${v1}/items`, itemsRouter);
app.use(`${v1}/purchases`, purchasesRouter);
app.use(`${v1}/consumptions`, consumptionsRouter);
app.use(`${v1}/writeoffs`, writeoffsRouter);

module.exports = app;