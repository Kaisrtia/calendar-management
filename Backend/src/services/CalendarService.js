const appointmentRepo = require('../repositories/AppointmentRepository');
const { scheduleReminderJobs } = require('../notifications/notificationQueue');

class CalendarService {
    async checkConflict(userId, startTime, endTime) {
        return await appointmentRepo.findConflict(userId, startTime, endTime);
    }

    async replaceAppointment(conflictApptId) {
        return await appointmentRepo.removeAppointment(conflictApptId);
    }

    async createAppointment(data) {
        const appointment = await appointmentRepo.createAppointment(data);
        try {
            await scheduleReminderJobs(appointment, data.userId);
        } catch (error) {
            // Do not block appointment creation if the reminder queue is unavailable.
            console.error('Failed to schedule reminder jobs:', error.message);
        }
        return appointment;
    }
}

module.exports = new CalendarService();
