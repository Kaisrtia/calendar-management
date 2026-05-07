const prisma = require('../config/db');

class AppointmentRepository {
    async findConflict(userId, startTime, endTime) {
        // Need to look up the user's calendar first to comply strictly with the schema
        const user = await prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
        if (!user || !user.calendar) return null;

        return await prisma.appointment.findFirst({
            where: {
                calendarId: user.calendar.id,
                OR: [
                    {
                        // New appointment starts during an existing appointment
                        startTime: { lt: new Date(endTime) },
                        endTime: { gt: new Date(startTime) }
                    }
                ]
            }
        });
    }

    async removeAppointment(id) {
        return await prisma.appointment.delete({
            where: { id }
        });
    }

    async createAppointment(data) {
        const user = await prisma.user.findUnique({ where: { userId: data.userId }, include: { calendar: true } });
        if (!user) {
            throw new Error('User not found');
        }

        let calendarId = user.calendar?.id;
        if (!calendarId) {
            const calendar = await prisma.calendar.create({ data: { userId: user.userId } });
            calendarId = calendar.id;
        }

        const appointmentData = {
            name: data.name,
            location: data.location,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            calendarId,
            reminders: {
                create: data.reminders?.map(remindAt => ({ remindAt: new Date(remindAt) })) || []
            }
        };

        if (data.isGroupMeeting) {
            appointmentData.groupMeeting = {
                create: {
                    participants: {
                        connect: [{ userId: data.userId }]
                    }
                }
            };
        }

        return await prisma.appointment.create({
            data: appointmentData,
            include: { reminders: true, groupMeeting: true }
        });
    }
}

module.exports = new AppointmentRepository();
