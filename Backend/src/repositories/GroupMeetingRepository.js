const prisma = require('../config/db');

class GroupMeetingRepository {
    async findMatchingGroupMeeting(name, duration) {
        return await prisma.groupMeeting.findFirst({
            where: { 
                name: name,
                duration: duration
            }
        });
    }

    async addParticipant(meetingId, userId) {
        return await prisma.groupMeeting.update({
            where: { id: meetingId },
            data: {
                participants: {
                    connect: { userId: userId }
                }
            }
        });
    }
}

module.exports = new GroupMeetingRepository();
