const depotService = require('./depotService');
const vehicleService = require('./vehicleService');

exports.createSchedule = (data) => {
  const depots = depotService.getDepots();
  const vehicles = vehicleService.getVehicles();

  return {
    message: 'Schedule created successfully',
    input: data,
    availableDepots: depots,
    availableVehicles: vehicles,
  };
};
