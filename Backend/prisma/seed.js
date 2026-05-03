const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clear existing data to avoid duplicates upon multi-seeds
  await prisma.reminder.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.groupMeeting.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Alice Designer',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Bob Engineer',
    },
  });

  console.log(`Created users: ${user1.name}, ${user2.name}`);

  // 3. Create a Group Meeting for testing the "Join Group" logic
  // The system checks for name and duration (in minutes)
  const groupMeeting1 = await prisma.groupMeeting.create({
    data: {
      name: 'Weekly Sync',
      duration: 60, // 60 minutes
      participants: {
        connect: [{ userId: user1.userId }], // Alice is already in the meeting
      },
    },
  });

  console.log(`Created group meeting: ${groupMeeting1.name}`);

  // 4. Create an existing Appointment for testing Time Conflicts
  // Let's say Alice has an appointment tomorrow from 10:00 AM to 11:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const existingAppointment = await prisma.appointment.create({
    data: {
      name: 'Design Review',
      location: 'Room A',
      startTime: tomorrow,
      endTime: tomorrowEnd,
      userId: user1.userId,
      reminders: {
        create: [
          { remindAt: new Date(tomorrow.getTime() - 15 * 60000) } // 15 mins before
        ]
      }
    },
  });

  console.log(`Created appointment: ${existingAppointment.name} for ${user1.name}`);
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
