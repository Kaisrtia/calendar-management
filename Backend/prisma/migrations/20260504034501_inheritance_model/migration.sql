/*
  Warnings:

  - You are about to drop the column `duration` on the `GroupMeeting` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `GroupMeeting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appointmentId]` on the table `GroupMeeting` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appointmentId` to the `GroupMeeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupMeeting" DROP COLUMN "duration",
DROP COLUMN "name",
ADD COLUMN     "appointmentId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GroupMeeting_appointmentId_key" ON "GroupMeeting"("appointmentId");

-- AddForeignKey
ALTER TABLE "GroupMeeting" ADD CONSTRAINT "GroupMeeting_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
