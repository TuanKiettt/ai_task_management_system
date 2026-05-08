-- AlterTable
ALTER TABLE `events` ADD COLUMN `attendees` INTEGER NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'meeting';
