const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./middleware/logger');
const schedulerRoutes = require('./routes/schedulerRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(logger);
app.use('/api', schedulerRoutes);

module.exports = app;
