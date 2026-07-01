const depotService = require('./depotService');
const vehicleService = require('./vehicleService');
const solveKnapsack = require('../utils/knapsack');
const Log = require('../middleware/logger');

async function safeLog(level, message) {
  try {
    await Log('backend', level, 'service', message);
  } catch (_error) {
    // Logging failures must not affect service execution.
  }
}

async function createSchedule(depotId) {
  try {
    const depots = await depotService.getDepots();
    const depot = depots.find((item) => Number(item.ID) === depotId);

    if (!depot) {
      await safeLog('warn', `Depot not found for depot ID ${depotId}`);
      throw new Error('Depot not found');
    }

    const mechanicHours = Number(depot.MechanicHours);
    const vehicles = await vehicleService.getVehicles();

    await safeLog('info', `Running knapsack for depot ID ${depotId}`);
    const schedule = solveKnapsack(vehicles, mechanicHours);
    await safeLog('info', `Knapsack completed for depot ID ${depotId}`);

    return {
      depotId,
      mechanicHours,
      totalDuration: schedule.totalDuration,
      totalImpact: schedule.totalImpact,
      selectedVehicles: schedule.selectedVehicles,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'Depot not found') {
      throw error;
    }

    await safeLog(
      'error',
      `Unexpected scheduler service exception: ${error.message}`,
    );
    throw error;
  }
}

module.exports = { createSchedule };
