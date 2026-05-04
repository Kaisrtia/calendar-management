const appointmentRepo = require('../repositories/AppointmentRepository');
const groupMeetingRepo = require('../repositories/GroupMeetingRepository');

class AppointmentService {
    async checkConflict(userId, startTime, endTime) {
        return await appointmentRepo.findConflict(userId, startTime, endTime);
    }

    async replaceAppointment(conflictApptId) {
        return await appointmentRepo.removeAppointment(conflictApptId);
    }

    async findMatchingGroupMeeting(name, duration) {
        return await groupMeetingRepo.findMatchingGroupMeeting(name, duration);
    }

    async confirmJoin(meetingId, userId) {
        return await groupMeetingRepo.addParticipant(meetingId, userId);
    }

    async createAppointment(data) {
        return await appointmentRepo.createAppointment(data);
    }
}

module.exports = new AppointmentService();
