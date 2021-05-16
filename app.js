const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const morgan = require('morgan');

const router = require('./routers');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json(), express.urlencoded({ extended: true }));

const limiter = rateLimit(
{
  windowMs: 30 * 1000,
  max: 10
});

app.use(limiter);

app.enable('trust proxy');

const speedLimiter = slowDown(
{
  windowMs: 30 * 1000,
  delayAfter: 10,
  delayMs: 500
});

app.use(speedLimiter);

app.use('/api/v1', router);

module.exports = app;