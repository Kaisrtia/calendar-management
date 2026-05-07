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
    startTime: appointment.startTime,
    description: appointment.description || ''
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

const scheduleReminderForMinutes = async (appointment, userId, reminderMinutesBefore) => {
  const minutes = Number(reminderMinutesBefore);
  if (!appointment || !Number.isFinite(minutes) || minutes <= 0) {
    return;
  }

  const startTime = new Date(appointment.startTime).getTime();
  if (Number.isNaN(startTime)) {
    return;
  }

  const remindAt = startTime - minutes * 60000;
  const delay = Math.max(remindAt - Date.now(), 0);

  await reminderQueue.add(
    'reminder',
    {
      userId,
      appointmentId: appointment.id,
      name: appointment.name,
      description: appointment.description || '',
      startTime: appointment.startTime,
      remindAt: new Date(remindAt).toISOString()
    },
    {
      delay,
      removeOnComplete: true,
      removeOnFail: 1000
    }
  );
};

new Worker(
  'appointment-reminders',
  async (job) => {
    const payload = job.data;
    notificationHub.notifyUser(payload.userId, {
      type: 'REMINDER',
      appointmentId: payload.appointmentId,
      name: payload.name,
      description: payload.description || '',
      startTime: payload.startTime,
      remindAt: payload.remindAt,
      message: `Reminder: ${payload.name} starts soon.`
    });
  },
  { connection }
);

module.exports = {
  scheduleReminderJobs,
  scheduleReminderForMinutes
}
