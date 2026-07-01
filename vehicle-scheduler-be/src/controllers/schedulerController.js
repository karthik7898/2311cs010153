const schedulerService = require('../services/schedulerService');
const Log = require('../middleware/logger');

async function safeLog(level, message) {
  try {
    await Log('backend', level, 'controller', message);
  } catch (_error) {
    // Logging failures must never affect API responses.
  }
}

function parseDepotId(depotId) {
  if (typeof depotId !== 'string' || !/^\d+$/.test(depotId)) {
    return null;
  }

  const parsedDepotId = Number(depotId);

  if (!Number.isSafeInteger(parsedDepotId) || parsedDepotId <= 0) {
    return null;
  }

  return parsedDepotId;
}

async function getHealth(_req, res) {
  await safeLog('info', 'Incoming health check request');

  const response = {
    success: true,
    message: 'Vehicle Scheduler API Running',
  };

  await safeLog('info', 'Health check response returned successfully');
  return res.status(200).json(response);
}

async function getSchedule(req, res) {
  await safeLog('info', 'Incoming schedule request');

  const depotId = parseDepotId(req.params?.depotId);

  if (depotId === null) {
    await safeLog('warn', 'Schedule request validation failed: invalid depot ID');
    return res.status(400).json({
      success: false,
      message: 'Invalid depot ID',
    });
  }

  await safeLog('info', `Depot ID received: ${depotId}`);

  try {
    await safeLog('info', `Service execution started for depot ID ${depotId}`);
    const result = await schedulerService.createSchedule(depotId);

    await safeLog(
      'info',
      `Schedule generated successfully for depot ID ${depotId}`,
    );
    await safeLog('info', `Returning response for depot ID ${depotId}`);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Depot not found') {
      await safeLog('warn', `Depot not found for depot ID ${depotId}`);
      return res.status(404).json({
        success: false,
        message: 'Depot not found',
      });
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    await safeLog(
      'error',
      `Unexpected exception while generating schedule: ${errorMessage}`,
    );

    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    });
  }
}

module.exports = {
  getHealth,
  getSchedule,
};
