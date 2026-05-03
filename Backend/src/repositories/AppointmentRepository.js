const prisma = require('../config/db');

class AppointmentRepository {
    async findConflict(userId, startTime, endTime) {
        return await prisma.appointment.findFirst({
            where: {
                userId: userId,
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
        return await prisma.appointment.create({
            data: {
                name: data.name,
                location: data.location,
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                userId: data.userId,
                reminders: {
                    create: data.reminders?.map(remindAt => ({ remindAt: new Date(remindAt) })) || []
                }
            },
            include: { reminders: true }
        });
    }
}

module.exports = new AppointmentRepository();
