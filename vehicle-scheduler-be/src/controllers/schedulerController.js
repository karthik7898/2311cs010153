const schedulerService = require('../services/schedulerService');

exports.getStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Vehicle scheduler backend is running',
  });
};

exports.createSchedule = (req, res) => {
  try {
    const result = schedulerService.createSchedule(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
