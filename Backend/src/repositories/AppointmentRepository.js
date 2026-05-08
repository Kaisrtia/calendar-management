const prisma = require('../config/db');

class AppointmentRepository {
    async findConflict(userId, startTime, endTime, excludeAppointmentId = null) {
        // Need to look up the user's calendar first to comply strictly with the schema
        const user = await prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
        if (!user || !user.calendar) return null;

        return await prisma.appointment.findFirst({
            where: {
                ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
                OR: [
                    {
                        calendarId: user.calendar.id,
                        groupMeeting: null
                    },
                    {
                        calendarId: user.calendar.id,
                        groupMeeting: { deletedAt: null }
                    },
                    {
                        groupMeeting: {
                            deletedAt: null,
                            participants: {
                                some: {
                                    userId: userId,
                                    deletedAt: null
                                }
                            }
                        }
                    }
                ],
                AND: [
                    {
                        // New appointment starts during an existing appointment
                        startTime: { lt: new Date(endTime) },
                        endTime: { gt: new Date(startTime) }
                    }
                ]
            }
        });
    }

    async findUserAppointments(userId) {
        const user = await prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
        if (!user || !user.calendar) return [];

        return await prisma.appointment.findMany({
            where: {
                calendarId: user.calendar.id,
                OR: [
                    { groupMeeting: null },
                    { groupMeeting: { deletedAt: null } }
                ]
            },
            include: {
                reminders: true,
                groupMeeting: {
                    include: {
                        owner: true,
                        participants: {
                            where: { deletedAt: null },
                            include: { user: true }
                        }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });
    }

    async findAppointmentById(id, userId) {
        const user = await prisma.user.findUnique({ where: { userId }, include: { calendar: true } });
        if (!user || !user.calendar) return null;

        return await prisma.appointment.findFirst({
            where: { id, calendarId: user.calendar.id },
            include: {
                reminders: true,
                groupMeeting: {
                    include: {
                        owner: true,
                        participants: {
                            where: { deletedAt: null },
                            include: { user: true }
                        }
                    }
                }
            }
        });
    }

    async removeAppointment(id) {
        return await prisma.appointment.delete({
            where: { id }
        });
    }

    buildReminderCreateData(data) {
        if (Array.isArray(data.reminders)) {
            return data.reminders.map(remindAt => ({ remindAt: new Date(remindAt) }));
        }

        if (data.reminderMinutesBefore === undefined || data.reminderMinutesBefore === null || data.reminderMinutesBefore === '') {
            return [];
        }

        const minutesBefore = Number(data.reminderMinutesBefore);
        if (!Number.isFinite(minutesBefore) || minutesBefore < 0) return [];

        return [{ remindAt: new Date(new Date(data.startTime).getTime() - minutesBefore * 60000) }];
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
            description: data.description?.trim() || null,
            location: data.location,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            calendarId,
            reminders: {
                create: this.buildReminderCreateData(data)
            }
        };

        if (data.isGroupMeeting) {
            appointmentData.groupMeeting = {
                create: {
                    owner: {
                        connect: { userId: data.userId }
                    },
                    participants: {
                        create: [
                            { user: { connect: { userId: data.userId } } }
                        ]
                    }
                }
            };
        }

        return await prisma.appointment.create({
            data: appointmentData,
            include: {
                reminders: true,
                groupMeeting: {
                    include: {
                        owner: true,
                        participants: {
                            where: { deletedAt: null },
                            include: { user: true }
                        }
                    }
                }
            }
        });
    }

    async updateAppointment(id, data) {
        const existing = await this.findAppointmentById(id, data.userId);
        if (!existing) return null;

        return await prisma.$transaction(async (tx) => {
            await tx.reminder.deleteMany({ where: { appointmentId: id } });

            if (data.isGroupMeeting && !existing.groupMeeting) {
                await tx.groupMeeting.create({
                    data: {
                        appointmentId: id,
                        ownerId: data.userId,
                        participants: {
                            create: [
                                { userId: data.userId }
                            ]
                        }
                    }
                });
            }

            if (!data.isGroupMeeting && existing.groupMeeting) {
                await tx.groupMeeting.delete({ where: { id: existing.groupMeeting.id } });
            }

            return await tx.appointment.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description?.trim() || null,
                    location: data.location,
                    startTime: new Date(data.startTime),
                    endTime: new Date(data.endTime),
                    reminders: {
                        create: this.buildReminderCreateData(data)
                    }
                },
                include: {
                    reminders: true,
                    groupMeeting: {
                        include: {
                            owner: true,
                            participants: {
                                where: { deletedAt: null },
                                include: { user: true }
                            }
                        }
                    }
                }
            });
        });
    }

    async deleteAppointmentForUser(id, userId) {
        const existing = await this.findAppointmentById(id, userId);
        if (!existing) return null;

        if (existing.groupMeeting) {
            if (existing.groupMeeting.ownerId !== userId) {
                const error = new Error("Only the meeting owner can delete this group meeting");
                error.statusCode = 403;
                throw error;
            }

            return await prisma.groupMeeting.update({
                where: { id: existing.groupMeeting.id },
                data: { deletedAt: new Date() }
            });
        }

        return await prisma.appointment.delete({
            where: { id }
        });
    }
}

module.exports = new AppointmentRepository();
