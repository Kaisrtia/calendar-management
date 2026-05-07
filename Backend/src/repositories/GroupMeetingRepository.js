const prisma = require('../config/db');

class GroupMeetingRepository {
    async findMatchingGroupMeeting(name, durationMinutes) {
        // Find group meetings where the associated appointment matches name and calculated duration
        const meetings = await prisma.groupMeeting.findMany({
            include: { appointment: true }
        });

        for (const gm of meetings) {
            if (gm.appointment.name === name) {
                const diffMs = new Date(gm.appointment.endTime) - new Date(gm.appointment.startTime);
                const diffMins = Math.round(diffMs / 60000);
                if (diffMins === durationMinutes) {
                    return gm;
                }
            }
        }
        return null;
    }

    async addParticipant(meetingId, userId) {
        return await prisma.groupMeeting.update({
            where: { id: meetingId },
            data: {
                participants: { connect: { userId } }
            },
            include: { appointment: { include: { reminders: true } } }
        });
    }

    async ensureUserCalendar(userId) {
        const user = await prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
        if (!user) {
            throw new Error('User not found');
        }
        if (!user.calendar) {
            await prisma.calendar.create({ data: { userId: user.userId } });
        }
    }
}
module.exports = new GroupMeetingRepository();
