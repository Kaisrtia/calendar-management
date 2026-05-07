const appointmentRepo = require('../repositories/AppointmentRepository');
const { scheduleReminderJobs } = require('../notifications/notificationQueue');

class CalendarService {
    async checkConflict(userId, startTime, endTime, excludeAppointmentId = null) {
        return await appointmentRepo.findConflict(userId, startTime, endTime, excludeAppointmentId);
    }

    async replaceAppointment(conflictApptId) {
        return await appointmentRepo.removeAppointment(conflictApptId);
    }

    async getAppointments(userId) {
        return await appointmentRepo.findUserAppointments(userId);
    }

    async getAppointment(id, userId) {
        return await appointmentRepo.findAppointmentById(id, userId);
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

    async updateAppointment(id, data) {
        return await appointmentRepo.updateAppointment(id, data);
    }

    async deleteAppointment(id, userId) {
        return await appointmentRepo.deleteAppointmentForUser(id, userId);
    }
}

module.exports = new CalendarService();
