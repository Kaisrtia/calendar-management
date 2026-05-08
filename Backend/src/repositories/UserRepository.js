const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserRepository {
    async getUsers() {
        return prisma.user.findMany({ include: { calendar: true } });
    }

    async getUserByIdWithCalendar(userId) {
        return prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
    }

    async getAppointmentsByCalendarId(calendarId) {
        return prisma.appointment.findMany({ 
            where: {
                calendarId: calendarId,
                groupMeeting: null
            },
            include: { reminders: true },
            orderBy: { startTime: 'asc' }
        });
    }

    async getGroupMeetingsByUserId(userId) {
        return prisma.groupMeeting.findMany({
            where: {
                deletedAt: null,
                participants: {
                    some: { userId, deletedAt: null }
                }
            },
            include: {
                appointment: { include: { reminders: true } },
                owner: true,
                participants: {
                    where: { deletedAt: null },
                    include: { user: true }
                }
            },
            orderBy: { appointment: { startTime: 'asc' } }
        });
    }
}

module.exports = new UserRepository();