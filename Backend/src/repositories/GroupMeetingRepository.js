const prisma = require('../config/db');

class GroupMeetingRepository {
    async findMatchingGroupMeeting(name, durationMinutes) {
        // Find group meetings where the associated appointment matches name and calculated duration
        const meetings = await prisma.groupMeeting.findMany({
            where: { deletedAt: null },
            include: {
                appointment: true,
                owner: true,
                participants: {
                    where: { deletedAt: null },
                    include: { user: true }
                }
            }
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
        const meeting = await prisma.groupMeeting.findFirst({
            where: { id: meetingId, deletedAt: null }
        });

        if (!meeting) return null;

        await prisma.groupMeetingParticipant.upsert({
            where: {
                groupMeetingId_userId: {
                    groupMeetingId: meetingId,
                    userId
                }
            },
            update: { deletedAt: null },
            create: {
                groupMeetingId: meetingId,
                userId
            }
        });

        return await prisma.groupMeeting.findUnique({
            where: { id: meetingId },
            include: {
                appointment: true,
                owner: true,
                participants: {
                    where: { deletedAt: null },
                    include: { user: true }
                }
            }
        });
    }

    async leaveParticipant(meetingId, userId) {
        const meeting = await prisma.groupMeeting.findFirst({
            where: {
                id: meetingId,
                deletedAt: null,
                participants: {
                    some: { userId, deletedAt: null }
                }
            }
        });

        if (!meeting) return null;
        if (meeting.ownerId === userId) {
            const error = new Error("Meeting owners must delete the group meeting instead of leaving it");
            error.statusCode = 403;
            throw error;
        }

        return await prisma.groupMeetingParticipant.update({
            where: {
                groupMeetingId_userId: {
                    groupMeetingId: meetingId,
                    userId
                }
            },
            data: {
                deletedAt: new Date()
            }
        });
    }
}
module.exports = new GroupMeetingRepository();
