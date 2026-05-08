const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/CalendarController');
const { validateAppointmentPayload } = require('../middlewares/validateAppointment');

// 1. Conflict Check
router.post('/check-conflict', calendarController.checkConflict.bind(calendarController));

// 2. Replace Old Appointment Config
router.post('/replace-conflict', calendarController.replaceAppointment.bind(calendarController));

// 3. Match checking for exactly named Group Meetings (requestAddAppointment)
router.post('/match-group-meeting', validateAppointmentPayload, calendarController.requestAddAppointment.bind(calendarController));

// 4. Optionally join
router.post('/join-group', calendarController.confirmJoin.bind(calendarController));
router.post('/group-meetings/:id/leave', calendarController.leaveGroupMeeting.bind(calendarController));

// 5. Final Create
router.get('/', calendarController.getAppointments.bind(calendarController));
router.post('/', validateAppointmentPayload, calendarController.createAppointment.bind(calendarController));
router.get('/:id', calendarController.getAppointment.bind(calendarController));
router.put('/:id', validateAppointmentPayload, calendarController.updateAppointment.bind(calendarController));
router.delete('/:id', calendarController.deleteAppointment.bind(calendarController));

module.exports = router;
