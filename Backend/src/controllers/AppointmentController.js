const appointmentService = require('../services/AppointmentService');

class AppointmentController {
    
    // Check if new appointment conflicts with existing ones
    async checkConflict(req, res) {
        try {
            const { userId, startTime, endTime } = req.body;
            if (!userId || !startTime || !endTime) {
                return res.status(400).json({ error: "Missing parameters" });
            }
            
            const conflict = await appointmentService.checkConflict(userId, startTime, endTime);
            return res.status(200).json({ conflict: conflict || null });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Replace the conflicting appointment
    async replaceAppointment(req, res) {
        try {
            const { conflictApptId } = req.body;
            if (!conflictApptId) return res.status(400).json({ error: "Missing conflict format" });

            await appointmentService.replaceAppointment(conflictApptId);
            return res.status(200).json({ message: "conflict resolved" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Find any system group matching the name and duration
    async requestAddAppointment(req, res) {
        try {
            const { name, startTime, endTime } = req.body;
            
            // Calculate duration in minutes securely
            const start = new Date(startTime);
            const end = new Date(endTime);
            
            if (end <= start || !name) {
                return res.status(400).json({ error: "Invalid duration or name" });
            }
            
            const duration = Math.round((end - start) / (1000 * 60)); // in minutes
            
            const matchingGroupMeeting = await appointmentService.findMatchingGroupMeeting(name, duration);
            
            return res.status(200).json({ matchedGroupMeeting: matchingGroupMeeting || null });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Join the matched group meeting
    async confirmJoin(req, res) {
        try {
            const { meetingId, userId } = req.body;
            await appointmentService.confirmJoin(meetingId, userId);
            
            return res.status(200).json({ message: "Joined successfully" });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Finally create the new appointment with its reminders
    async createAppointment(req, res) {
        try {
            const appointment = await appointmentService.createAppointment(req.body);
            return res.status(201).json({ message: "Added successfully", appointment });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AppointmentController();
