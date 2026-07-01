require('dotenv').config();

const app = require('./app');
const Log = require('./middleware/logger');

const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;

const server = app.listen(port, async () => {
  try {
    await Log(
      'backend',
      'info',
      'config',
      `Application started on port ${port}`,
    );
  } catch (_error) {
    // Logging must never interrupt application startup.
  }
});

server.on('error', async (error) => {
  try {
    await Log(
      'backend',
      'fatal',
      'config',
      `Application startup failed: ${error.message}`,
    );
  } catch (_loggingError) {
    // Preserve the original server error when logging is unavailable.
  }
});

module.exports = server;
