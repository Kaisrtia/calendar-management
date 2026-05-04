const groupMeetingRepo = require('../repositories/GroupMeetingRepository');

class GroupMeetingService {
    async findMatchingGroupMeeting(name, duration) {
        return await groupMeetingRepo.findMatchingGroupMeeting(name, duration);
    }

    async confirmJoin(meetingId, userId) {
        return await groupMeetingRepo.addParticipant(meetingId, userId);
    }
}

module.exports = new GroupMeetingService();
