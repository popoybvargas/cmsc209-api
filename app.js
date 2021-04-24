const express = require('express');
const morgan = require('morgan');

const router = require('./routers/usersRouter');
const categoriesRouter = require('./routers/categoriesRouter');

const app = express();

app.use(morgan('tiny'));
app.use(express.json(), express.urlencoded({ extended: true }));

const v1 = '/api/v1';
app.use(`${v1}/users`, router);
app.use(`${v1}/categories`, categoriesRouter);

module.exports = app;