/*
  Warnings:

  - The `proofUrl` column on the `TaskVolunteer` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "TaskVolunteer" DROP COLUMN "proofUrl",
ADD COLUMN     "proofUrl" BYTEA;
