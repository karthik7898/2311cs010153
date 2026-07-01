function validateInputs(vehicles, mechanicHours) {
  if (!Array.isArray(vehicles)) {
    throw new TypeError('Vehicles must be an array');
  }

  if (!Number.isSafeInteger(mechanicHours) || mechanicHours < 0) {
    throw new TypeError('Mechanic hours must be a non-negative integer');
  }

  vehicles.forEach((vehicle) => {
    const duration = Number(vehicle.Duration);
    const impact = Number(vehicle.Impact);

    if (!Number.isSafeInteger(duration) || duration < 0) {
      throw new TypeError('Vehicle duration must be a non-negative integer');
    }

    if (!Number.isFinite(impact) || impact < 0) {
      throw new TypeError('Vehicle impact must be a non-negative number');
    }
  });
}

function solveKnapsack(vehicles, mechanicHours) {
  validateInputs(vehicles, mechanicHours);

  const vehicleCount = vehicles.length;
  const maximumImpact = Array.from({ length: vehicleCount + 1 }, () =>
    Array(mechanicHours + 1).fill(0),
  );

  for (let index = 1; index <= vehicleCount; index += 1) {
    const duration = Number(vehicles[index - 1].Duration);
    const impact = Number(vehicles[index - 1].Impact);

    for (let capacity = 0; capacity <= mechanicHours; capacity += 1) {
      maximumImpact[index][capacity] = maximumImpact[index - 1][capacity];

      if (duration <= capacity) {
        const impactWithVehicle =
          maximumImpact[index - 1][capacity - duration] + impact;

        if (impactWithVehicle > maximumImpact[index][capacity]) {
          maximumImpact[index][capacity] = impactWithVehicle;
        }
      }
    }
  }

  const selectedVehicles = [];
  let remainingCapacity = mechanicHours;

  for (let index = vehicleCount; index > 0; index -= 1) {
    if (
      maximumImpact[index][remainingCapacity] !==
      maximumImpact[index - 1][remainingCapacity]
    ) {
      const vehicle = vehicles[index - 1];
      selectedVehicles.push(vehicle);
      remainingCapacity -= Number(vehicle.Duration);
    }
  }

  selectedVehicles.reverse();

  const totalDuration = selectedVehicles.reduce(
    (total, vehicle) => total + Number(vehicle.Duration),
    0,
  );

  return {
    totalDuration,
    totalImpact: maximumImpact[vehicleCount][mechanicHours],
    selectedVehicles,
  };
}

module.exports = solveKnapsack;
