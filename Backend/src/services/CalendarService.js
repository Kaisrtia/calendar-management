const appointmentRepo = require('../repositories/AppointmentRepository');

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
        return await appointmentRepo.createAppointment(data);
    }

    async updateAppointment(id, data) {
        return await appointmentRepo.updateAppointment(id, data);
    }

    async deleteAppointment(id, userId) {
        return await appointmentRepo.deleteAppointmentForUser(id, userId);
    }
}

module.exports = new CalendarService();
