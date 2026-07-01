const express = require('express');
const cors = require('cors');
const Log = require('./middleware/logger');
const schedulerRoutes = require('./routes/schedulerRoutes');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.use(async (req, _res, next) => {
  try {
    await Log(
      'backend',
      'info',
      'middleware',
      `Incoming request: ${req.method} ${req.originalUrl}`,
    );
  } catch (_error) {
    // Logging must never interrupt request processing.
  }

  next();
});

app.use('/', schedulerRoutes);

module.exports = app;
