const groupMeetingRepo = require('../repositories/GroupMeetingRepository');
const { scheduleReminderJobs } = require('../notifications/notificationQueue');

class GroupMeetingService {
    async findMatchingGroupMeeting(name, duration) {
        return await groupMeetingRepo.findMatchingGroupMeeting(name, duration);
    }

    async confirmJoin(meetingId, userId) {
        await groupMeetingRepo.ensureUserCalendar(userId);
        const meeting = await groupMeetingRepo.addParticipant(meetingId, userId);
        try {
            if (meeting?.appointment) {
                await scheduleReminderJobs(meeting.appointment, userId);
            }
        } catch (error) {
            // Do not block joining if reminder scheduling fails.
            console.error('Failed to schedule group meeting reminders:', error.message);
        }
        return meeting;
    }
}

module.exports = new GroupMeetingService();
