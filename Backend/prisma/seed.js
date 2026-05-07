const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  await prisma.reminder.deleteMany();
  await prisma.groupMeeting.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.user.deleteMany();

  // Create users AND their 1:1 Calendar simultaneously
  const user1 = await prisma.user.create({ 
    data: { 
      name: 'Alice Designer',
      calendar: { create: {} }
    },
    include: { calendar: true }
  });
  
  const user2 = await prisma.user.create({ 
    data: { 
      name: 'Bob Engineer',
      calendar: { create: {} }
    },
    include: { calendar: true }
  });

  console.log(`Created users: ${user1.name}, ${user2.name}`);

  // Create a Group Meeting via Appointment inheritance
  const gmStart = new Date();
  gmStart.setHours(gmStart.getHours() + 2); // 2 hours from now
  const gmEnd = new Date(gmStart);
  gmEnd.setHours(gmEnd.getHours() + 1); // 1 hour duration

  const groupMeetingAppt = await prisma.appointment.create({
    data: {
      name: 'Weekly Sync',
      description: 'Weekly alignment for design and engineering progress.',
      location: 'Zoom Room',
      startTime: gmStart,
      endTime: gmEnd,
      calendarId: user1.calendar.id, // Alice's calendar
      groupMeeting: {
        create: {
          owner: {
            connect: { userId: user1.userId }
          },
          participants: {
             // Participant uses User ID (not Calendar ID)
            create: [
              { user: { connect: { userId: user1.userId } } }
            ]
          }
        }
      }
    },
    include: {
      groupMeeting: true
    }
  });

  console.log(`Created group meeting: ${groupMeetingAppt.name}`);

  const monthlyStart = new Date();
  monthlyStart.setDate(monthlyStart.getDate() + 2);
  monthlyStart.setHours(14, 0, 0, 0);
  const monthlyEnd = new Date(monthlyStart);
  monthlyEnd.setHours(15, 30, 0, 0);

  const groupMeetingAppt2 = await prisma.appointment.create({
    data: {
      name: 'Monthly Planning',
      description: 'Plan roadmap priorities and assign upcoming delivery tasks.',
      location: 'Conference Room B',
      startTime: monthlyStart,
      endTime: monthlyEnd,
      calendarId: user2.calendar.id, // Bob's Calendar
      groupMeeting: {
        create: {
          owner: {
            connect: { userId: user2.userId }
          },
          participants: {
            create: [
              { user: { connect: { userId: user2.userId } } },
              { user: { connect: { userId: user1.userId } } }
            ]
          }
        }
      }
    }
  });

  console.log(`Created group meeting: ${groupMeetingAppt2.name}`);

  const codeRevStart = new Date();
  codeRevStart.setDate(codeRevStart.getDate() + 3); 
  codeRevStart.setHours(11, 0, 0, 0); 
  const codeRevEnd = new Date(codeRevStart);
  codeRevEnd.setHours(12, 0, 0, 0);

  const groupMeetingAppt3 = await prisma.appointment.create({
    data: {
      name: 'Code Review Session',
      description: 'Review open pull requests and discuss implementation feedback.',
      location: 'Google Meet',
      startTime: codeRevStart,
      endTime: codeRevEnd,
      calendarId: user2.calendar.id,
      groupMeeting: {
        create: {
          owner: {
            connect: { userId: user2.userId }
          },
          participants: {
            create: [
              { user: { connect: { userId: user2.userId } } }
            ]
          }
        }
      }
    }
  });

  console.log(`Created group meeting: ${groupMeetingAppt3.name}`);

  // Create an existing Appointment for time conflicts
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 0, 0, 0);

  const existingAppointment = await prisma.appointment.create({
    data: {
      name: 'Design Review',
      description: 'Review latest UI drafts and capture design changes.',
      location: 'Room A',
      startTime: tomorrow,
      endTime: tomorrowEnd,
      calendarId: user1.calendar.id, // Linked to Alice's Calendar
      reminders: {
        create: [
          { remindAt: new Date(tomorrow.getTime() - 15 * 60000) }
        ]
      }
    },
  });

  console.log(`Created appointment: ${existingAppointment.name} for ${user1.name}`);
  console.log('Seeding finished.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
