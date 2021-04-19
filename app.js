const express = require('express');
const morgan = require('morgan');

const router = require('./routers/usersRouter');

const app = express();

app.use(morgan('tiny'));
app.use(express.json(), express.urlencoded({ extended: true }));

app.use('/api/v1/users', router);

module.exports = app;