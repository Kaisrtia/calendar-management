const userRepository = require('../repositories/UserRepository');

class UserService {
    async getUsers() {
        return userRepository.getUsers();
    }

    async getUserSchedule(userId) {
        const user = await userRepository.getUserByIdWithCalendar(userId);

        if (!user) {
            return { appointments: [], groupMeetings: [] };
        }

        const appointments = await userRepository.getAppointmentsByCalendarId(user.calendar.id);
        
        const groupMeetings = await userRepository.getGroupMeetingsByUserId(userId);
        
        return { appointments, groupMeetings };
    }
}

module.exports = new UserService();
