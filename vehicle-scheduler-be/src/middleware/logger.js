const axios = require('axios');

const VALID_STACKS = new Set(['backend', 'frontend']);
const VALID_LEVELS = new Set(['debug', 'info', 'warn', 'error', 'fatal']);
const VALID_PACKAGES = new Set([
  'cache',
  'controller',
  'cron_job',
  'db',
  'domain',
  'handler',
  'repository',
  'route',
  'service',
  'auth',
  'config',
  'middleware',
  'utils',
]);

async function Log(stack, level, packageName, message) {
  try {
    if (!VALID_STACKS.has(stack)) {
      throw new Error('Invalid logging stack');
    }

    if (!VALID_LEVELS.has(level)) {
      throw new Error('Invalid logging level');
    }

    if (!VALID_PACKAGES.has(packageName)) {
      throw new Error('Invalid logging package');
    }

    const response = await axios.post(
      process.env.LOG_API_URL,
      { stack, level, package: packageName, message },
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (_error) {
    return null;
  }
}

module.exports = Log;
