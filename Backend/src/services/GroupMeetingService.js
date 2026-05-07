const groupMeetingRepo = require('../repositories/GroupMeetingRepository');
const { scheduleReminderJobs, scheduleReminderForMinutes } = require('../notifications/notificationQueue');
const notificationHub = require('../notifications/notificationHub');

class GroupMeetingService {
    async findMatchingGroupMeeting(name, duration, location) {
        return await groupMeetingRepo.findMatchingGroupMeeting(name, duration, location);
    }

    async confirmJoin(meetingId, userId, reminderMinutesBefore) {
        await groupMeetingRepo.ensureUserCalendar(userId);
        const meeting = await groupMeetingRepo.addParticipant(meetingId, userId);
        if (meeting) {
            this.notifyJoinParticipants(meeting, userId);
        }
        try {
            if (meeting?.appointment) {
                if (reminderMinutesBefore) {
                    await scheduleReminderForMinutes(meeting.appointment, userId, reminderMinutesBefore);
                } else {
                    await scheduleReminderJobs(meeting.appointment, userId);
                }
            }
        } catch (error) {
            // Do not block joining if reminder scheduling fails.
            console.error('Failed to schedule group meeting reminders:', error.message);
        }
        return meeting;
    }

    async leaveMeeting(meetingId, userId) {
        return await groupMeetingRepo.leaveParticipant(meetingId, userId);
    }

    notifyJoinParticipants(meeting, joinedUserId) {
        const appointmentName = meeting?.appointment?.name || 'group meeting';
        const joinedUser = meeting?.participants
            ?.map(participant => participant.user)
            .find(user => user?.userId === joinedUserId);
        const joinedName = joinedUser?.name || 'A participant';

        const targetIds = new Set();
        if (meeting?.ownerId) targetIds.add(meeting.ownerId);
        for (const participant of meeting?.participants || []) {
            if (participant?.userId) targetIds.add(participant.userId);
        }

        targetIds.delete(joinedUserId);

        const payload = {
            type: 'GROUP_JOINED',
            meetingId: meeting?.id,
            appointmentId: meeting?.appointment?.id,
            message: `${joinedName} joined "${appointmentName}".`
        };

        for (const targetId of targetIds) {
            notificationHub.notifyUser(targetId, payload);
        }
    }
}

module.exports = new GroupMeetingService();
