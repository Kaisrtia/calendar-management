const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/AppointmentController');

// 1. Conflict Check
router.post('/check-conflict', appointmentController.checkConflict.bind(appointmentController));

// 2. Replace Old Appointment Config
router.post('/replace-conflict', appointmentController.replaceAppointment.bind(appointmentController));

// 3. Match checking for exactly named Group Meetings (requestAddAppointment)
router.post('/match-group-meeting', appointmentController.requestAddAppointment.bind(appointmentController));

// 4. Optionally join
router.post('/join-group', appointmentController.confirmJoin.bind(appointmentController));

// 5. Final Create
router.post('/', appointmentController.createAppointment.bind(appointmentController));

module.exports = router;
