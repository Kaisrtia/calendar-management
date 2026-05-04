const appointmentRepo = require('../repositories/AppointmentRepository');

class CalendarService {
    async checkConflict(userId, startTime, endTime) {
        return await appointmentRepo.findConflict(userId, startTime, endTime);
    }

    async replaceAppointment(conflictApptId) {
        return await appointmentRepo.removeAppointment(conflictApptId);
    }

    async createAppointment(data) {
        return await appointmentRepo.createAppointment(data);
    }
}

module.exports = new CalendarService();
