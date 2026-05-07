const { Queue, Worker } = require('bullmq');
const { connection } = require('../config/redis.connection');
const notificationHub = require('./notificationHub');

const reminderQueue = new Queue('appointment-reminders', { connection });

const scheduleReminderJobs = async (appointment, userId) => {
  if (!appointment || !appointment.reminders || appointment.reminders.length === 0) {
    return;
  }

  const now = Date.now();
  const basePayload = {
    userId,
    appointmentId: appointment.id,
    name: appointment.name,
    startTime: appointment.startTime
  };

  for (const reminder of appointment.reminders) {
    const remindAt = new Date(reminder.remindAt).getTime();
    const delay = Math.max(remindAt - now, 0);

    await reminderQueue.add(
      'reminder',
      {
        ...basePayload,
        remindAt: new Date(remindAt).toISOString()
      },
      {
        delay,
        removeOnComplete: true,
        removeOnFail: 1000
      }
    );
  }
};

new Worker(
  'appointment-reminders',
  async (job) => {
    const payload = job.data;
    notificationHub.notifyUser(payload.userId, {
      type: 'REMINDER',
      appointmentId: payload.appointmentId,
      name: payload.name,
      startTime: payload.startTime,
      remindAt: payload.remindAt,
      message: `Reminder: ${payload.name} starts soon.`
    });
  },
  { connection }
);

module.exports = {
  scheduleReminderJobs
};
