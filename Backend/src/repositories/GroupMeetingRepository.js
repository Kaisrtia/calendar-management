const prisma = require('../config/db');

class GroupMeetingRepository {
    normalizeMatchValue(value) {
        return String(value || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    }

    async findMatchingGroupMeeting(name, durationMinutes, location) {
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

        const normalizedName = this.normalizeMatchValue(name);
        const normalizedLocation = this.normalizeMatchValue(location);

        for (const gm of meetings) {
            const matchName = this.normalizeMatchValue(gm.appointment.name);
            const matchLocation = this.normalizeMatchValue(gm.appointment.location);
            if (matchName === normalizedName && matchLocation === normalizedLocation) {
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
            },
            include: {
                groupMeeting: {
                    include: {
                        appointment: { include: { reminders: true } }
                    }
                }
            }
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
