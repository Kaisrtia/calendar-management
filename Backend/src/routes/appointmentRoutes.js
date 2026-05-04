const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/CalendarController');

// 1. Conflict Check
router.post('/check-conflict', calendarController.checkConflict.bind(calendarController));

// 2. Replace Old Appointment Config
router.post('/replace-conflict', calendarController.replaceAppointment.bind(calendarController));

// 3. Match checking for exactly named Group Meetings (requestAddAppointment)
router.post('/match-group-meeting', calendarController.requestAddAppointment.bind(calendarController));

// 4. Optionally join
router.post('/join-group', calendarController.confirmJoin.bind(calendarController));

// 5. Final Create
router.post('/', calendarController.createAppointment.bind(calendarController));

module.exports = router;
