const axios = require('axios');
const Log = require('../middleware/logger');

async function safeLog(level, message) {
  try {
    await Log('backend', level, 'service', message);
  } catch (_error) {
    // Logging failures must not affect service execution.
  }
}

function getApiConfiguration() {
  const { BASE_URL, ACCESS_TOKEN } = process.env;

  if (!BASE_URL || !ACCESS_TOKEN) {
    throw new Error('Protected API configuration is missing');
  }

  return {
    url: `${BASE_URL.replace(/\/$/, '')}/vehicles`,
    config: {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    },
  };
}

async function getVehicles() {
  await safeLog('info', 'Fetching vehicles');

  try {
    const { url, config } = getApiConfiguration();
    await safeLog('info', 'Calling protected vehicles API');

    process.stdout.write(`Vehicles URL: ${url}\n`);
    const response = await axios.get(url, config);

    if (!response.data || !Array.isArray(response.data.vehicles)) {
      throw new Error('Invalid vehicles API response');
    }

    await safeLog('info', 'Vehicles API response received successfully');
    return response.data.vehicles;
  } catch (error) {
    await safeLog('error', `Vehicles API failure: ${error.message}`);
    throw error;
  }
}

module.exports = { getVehicles };
