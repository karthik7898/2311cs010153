const Log = require("./logger");

async function run() {
  const result = await Log(
    "backend",
    "info",
    "service",
    "Logging middleware initialized"
  );

  console.log(result);
}

run();