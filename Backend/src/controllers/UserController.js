const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserController {
    async getUsers(req, res) {
        try {
            const users = await prisma.user.findMany({ include: { calendar: true } });
            res.json(users);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
    
    async getUserSchedule(req, res) {
        try {
            const { userId } = req.params;
            const user = await prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
            
            if (!user || !user.calendar) {
                return res.json({ appointments: [], groupMeetings: [] });
            }

            const appointments = await prisma.appointment.findMany({ 
                where: {
                    calendarId: user.calendar.id,
                    groupMeeting: null
                },
                include: { reminders: true },
                orderBy: { startTime: 'asc' }
            });
            const groupMeetings = await prisma.groupMeeting.findMany({
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
            res.json({ appointments, groupMeetings });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
module.exports = new UserController();
