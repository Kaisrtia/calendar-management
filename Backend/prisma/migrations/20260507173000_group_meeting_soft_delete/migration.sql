-- Add meeting-level soft delete and owner control.
ALTER TABLE "GroupMeeting" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "GroupMeeting" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Existing group meetings are owned by the user whose calendar owns the backing appointment.
UPDATE "GroupMeeting" AS gm
SET "ownerId" = c."userId"
FROM "Appointment" AS a
JOIN "Calendar" AS c ON c."id" = a."calendarId"
WHERE gm."appointmentId" = a."id";

-- Fallback for any legacy rows that cannot be resolved through Appointment -> Calendar.
UPDATE "GroupMeeting" AS gm
SET "ownerId" = link."B"
FROM "_GroupMeetingToUser" AS link
WHERE gm."id" = link."A"
  AND gm."ownerId" IS NULL;

ALTER TABLE "GroupMeeting" ALTER COLUMN "ownerId" SET NOT NULL;

-- Replace Prisma's implicit many-to-many table with an explicit membership entity
-- so each participant can leave without deleting the meeting for everyone else.
CREATE TABLE "GroupMeetingParticipant" (
    "id" TEXT NOT NULL,
    "groupMeetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GroupMeetingParticipant_pkey" PRIMARY KEY ("id")
);

INSERT INTO "GroupMeetingParticipant" ("id", "groupMeetingId", "userId")
SELECT link."A" || ':' || link."B", link."A", link."B"
FROM "_GroupMeetingToUser" AS link;

CREATE UNIQUE INDEX "GroupMeetingParticipant_groupMeetingId_userId_key"
ON "GroupMeetingParticipant"("groupMeetingId", "userId");

ALTER TABLE "GroupMeeting"
ADD CONSTRAINT "GroupMeeting_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMeetingParticipant"
ADD CONSTRAINT "GroupMeetingParticipant_groupMeetingId_fkey"
FOREIGN KEY ("groupMeetingId") REFERENCES "GroupMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GroupMeetingParticipant"
ADD CONSTRAINT "GroupMeetingParticipant_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "_GroupMeetingToUser";
