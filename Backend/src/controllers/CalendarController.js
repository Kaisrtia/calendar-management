const calendarService = require('../services/CalendarService');
const groupMeetingService = require('../services/GroupMeetingService');

const withReminderFromMinutes = (payload) => {
    const minutes = Number(payload.remindBeforeMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return payload;
    }

    const startTime = new Date(payload.startTime);
    if (Number.isNaN(startTime.getTime())) {
        return payload;
    }

    if (Array.isArray(payload.reminders) && payload.reminders.length > 0) {
        return payload;
    }

    const remindAt = new Date(startTime.getTime() - minutes * 60000).toISOString();
    return { ...payload, reminders: [remindAt] };
};

const isStartInPast = (startTime) => {
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
        return false;
    }
    return start <= new Date();
};



class CalendarController {

    // Check if new appointment conflicts with existing ones
    async checkConflict(req, res) {
        try {
            const { userId, startTime, endTime, excludeAppointmentId } = req.body;
            if (!userId || !startTime || !endTime) {
                return res.status(400).json({ error: "Missing parameters" });
            }

            const conflict = await calendarService.checkConflict(userId, startTime, endTime, excludeAppointmentId);
            return res.status(200).json({ conflict: conflict || null });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Replace the conflicting appointment
    async replaceAppointment(req, res) {
        try {
            const { conflictApptId, userId } = req.body;
            if (!conflictApptId) return res.status(400).json({ error: "Missing conflict format" });

            if (userId) {
                await calendarService.deleteAppointment(conflictApptId, userId);
            } else {
                await calendarService.replaceAppointment(conflictApptId);
            }
            return res.status(200).json({ message: "conflict resolved" });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    // Find any system group matching the name and duration, otherwise automatically create the appointment
    async requestAddAppointment(req, res) {
        try {
            const { name, startTime, endTime, location } = req.body;

            // Calculate duration in minutes securely
            const start = new Date(startTime);
            const end = new Date(endTime);

            if (end <= start || !name) {
                return res.status(400).json({ error: "Invalid duration or name" });
            }

            if (isStartInPast(startTime)) {
                return res.status(400).json({ error: "Start time must be in the future" });
            }

            const duration = Math.round((end - start) / (1000 * 60)); // in minutes

            const matchingGroupMeeting = await groupMeetingService.findMatchingGroupMeeting(name, duration, location);

            if (matchingGroupMeeting) {
                return res.status(200).json({ matchedGroupMeeting: matchingGroupMeeting });
            } else {
                // [No matching group meeting]
                // According to UML, create appointment and reminders immediately
                const appointment = await calendarService.createAppointment(withReminderFromMinutes(req.body));
                return res.status(201).json({ message: "Added successfully", appointment });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Join the matched group meeting
    async confirmJoin(req, res) {
        try {
            const { meetingId, userId, reminderMinutesBefore } = req.body;
            const minutes = reminderMinutesBefore === '' || reminderMinutesBefore === null ? null : Number(reminderMinutesBefore);
            if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0)) {
                return res.status(400).json({ error: 'Reminder must be a positive number of minutes before the appointment' });
            }

            const meeting = await groupMeetingService.confirmJoin(meetingId, userId, minutes);
            if (!meeting) return res.status(404).json({ error: "Group meeting not found" });

            return res.status(200).json({ message: "Joined successfully" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async leaveGroupMeeting(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ error: "Missing user" });

            const participant = await groupMeetingService.leaveMeeting(id, userId);
            if (!participant) return res.status(404).json({ error: "Active participant membership not found" });

            return res.status(200).json({ message: "Removed from schedule" });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    // Create the new appointment with its reminders manually when "No" is chosen
    async createAppointment(req, res) {
        try {
            const appointment = await calendarService.createAppointment(req.body);
            return res.status(201).json({ message: "Added successfully", appointment });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getAppointments(req, res) {
        try {
            const { userId } = req.query;
            if (!userId) return res.status(400).json({ error: "Missing user" });

            const appointments = await calendarService.getAppointments(userId);
            return res.status(200).json(appointments);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getAppointment(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.query;
            if (!userId) return res.status(400).json({ error: "Missing user" });

            const appointment = await calendarService.getAppointment(id, userId);
            if (!appointment) return res.status(404).json({ error: "Appointment not found" });

            return res.status(200).json(appointment);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const existing = await calendarService.getAppointment(id, req.body.userId);
            if (!existing) return res.status(404).json({ error: "Appointment not found" });
            if (existing.groupMeeting && existing.groupMeeting.ownerId !== req.body.userId) {
                return res.status(403).json({ error: "Only the meeting owner can update this group meeting" });
            }

            const conflict = await calendarService.checkConflict(req.body.userId, req.body.startTime, req.body.endTime, id);
            if (conflict) {
                return res.status(409).json({ error: "Time conflict", conflict });
            }

            const appointment = await calendarService.updateAppointment(id, req.body);

            return res.status(200).json({ message: "Updated successfully", appointment });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async deleteAppointment(req, res) {
        try {
            const { id } = req.params;
            const { userId } = req.query;
            if (!userId) return res.status(400).json({ error: "Missing user" });

            const appointment = await calendarService.getAppointment(id, userId);
            if (!appointment) return res.status(404).json({ error: "Appointment not found" });

            await calendarService.deleteAppointment(id, userId);
            return res.status(200).json({ message: "Deleted successfully" });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ error: "Appointment not found" });
            }
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new CalendarController();
