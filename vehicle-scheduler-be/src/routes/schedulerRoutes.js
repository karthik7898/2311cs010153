const express = require('express');
const schedulerController = require('../controllers/schedulerController');
const Log = require('../middleware/logger');

const router = express.Router();

async function logRouteRequest(req, _res, next) {
  try {
    await Log(
      'backend',
      'info',
      'route',
      `Routing request: ${req.method} ${req.originalUrl}`,
    );
  } catch (_error) {
    // Logging must never interrupt request routing.
  }

  next();
}

router.get('/', logRouteRequest, schedulerController.getHealth);
router.get(
  '/schedule/:depotId',
  logRouteRequest,
  schedulerController.getSchedule,
);

module.exports = router;
