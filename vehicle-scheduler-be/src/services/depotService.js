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
    url: `${BASE_URL.replace(/\/$/, '')}/depots`,
    config: {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    },
  };
}

async function getDepots() {
  await safeLog('info', 'Fetching depots');

  try {
    const { url, config } = getApiConfiguration();
    await safeLog('info', 'Calling protected depots API');

    process.stdout.write(`Depots URL: ${url}\n`);
    const response = await axios.get(url, config);
    process.stdout.write(`${JSON.stringify(response.data, null, 2)}\n`);

    if (!response.data || !Array.isArray(response.data.depots)) {
      throw new Error('Invalid depots API response');
    }

    await safeLog('info', 'Depots API response received successfully');
    return response.data.depots;
  } catch (error) {
    await safeLog('error', `Depots API failure: ${error.message}`);
    throw error;
  }
}

module.exports = { getDepots };
