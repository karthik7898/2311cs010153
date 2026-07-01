    const axios = require("axios");
    require("dotenv").config();

    const VALID_STACKS = ["backend", "frontend"];

    const VALID_LEVELS = [
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
    ];

    const VALID_PACKAGES = [
    "cache",
    "controller",
    "cron_job",
    "db",
    "domain",
    "handler",
    "repository",
    "route",
    "service",
    "auth",
    "config",
    "middleware",
    "utils",
    ];

    async function Log(stack, level, packageName, message) {
    try {
        if (!VALID_STACKS.includes(stack))
        throw new Error("Invalid stack");

        if (!VALID_LEVELS.includes(level))
        throw new Error("Invalid level");

        if (!VALID_PACKAGES.includes(packageName))
        throw new Error("Invalid package");

        const response = await axios.post(
        process.env.LOG_API_URL,
        {
            stack,
            level,
            package: packageName,
            message,
        },
        {
            headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            "Content-Type": "application/json",
            },
        }
        );

        return response.data;
    } catch (error) {
    console.error("Logging failed:", error.response?.data || error.message);
    return null;
}
    }

    module.exports = Log;