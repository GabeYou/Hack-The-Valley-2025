-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'in_review';

-- AlterTable
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'open';
