const validateAppointmentPayload = (req, res, next) => {
    const { userId, name, location, startTime, endTime } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (!userId) return res.status(400).json({ error: "Missing user" });
    if (!name || !name.trim()) return res.status(400).json({ error: "Appointment name is required" });
    if (!location || !location.trim()) return res.status(400).json({ error: "Location is required" });
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return res.status(400).json({ error: "Start and end times are required" });
    if (end <= start) return res.status(400).json({ error: "End time must be after start time" });

    if (req.body.reminderMinutesBefore !== undefined && req.body.reminderMinutesBefore !== null && req.body.reminderMinutesBefore !== '') {
        const minutesBefore = Number(req.body.reminderMinutesBefore);
        if (!Number.isFinite(minutesBefore) || minutesBefore < 0) {
            return res.status(400).json({ error: "Reminder must be a positive number of minutes before the appointment" });
        }
    }

    next();
};

module.exports = { validateAppointmentPayload };
