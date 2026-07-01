const express = require('express');
const controller = require('../controllers/schedulerController');

const router = express.Router();

router.get('/health', controller.getStatus);
router.post('/schedule', controller.createSchedule);

module.exports = router;
